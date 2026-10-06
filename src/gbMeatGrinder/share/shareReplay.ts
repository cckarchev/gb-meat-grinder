/**
 * Share links, decoding side: the blob is replayed as reducer actions on the
 * model's fresh state, so a stale or tampered link goes through the same
 * validation and clamping as clicks in the UI.
 */

import { availableBuffs } from '@/core/attackers/buffsAndTraits';
import { playbookIndex } from '@/core/playbook/playbookIndex';
import { fromBase64Url } from '@/core/shared/base64Url';
import { clamp } from '@/core/shared/clamp';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { findAttackerById } from '@/data/attackers/registry';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type {
  BooleanActionType,
  MeatGrinderAction,
  MeatGrinderState,
  NumberActionType,
} from '@/gbMeatGrinder/reducer/reducer.types';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';
import {
  SHARE_MODEL_PARAM,
  SHARE_STATE_PARAM,
  SHARE_WIRE_VERSION,
  type Slot,
  type WireFields,
} from '@/gbMeatGrinder/share/shareWire';

const readNumber = (value: unknown): number | undefined => {
  const isFiniteNumber = typeof value === 'number' && Number.isFinite(value);

  return isFiniteNumber ? value : undefined;
};

const readBoolean = (value: unknown): boolean | undefined => {
  return typeof value === 'boolean' ? value : undefined;
};

const readArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const readStrings = (value: unknown): string[] => {
  return readArray(value).filter((item) => typeof item === 'string');
};

const readSlot = (value: unknown): Slot => {
  return typeof value === 'string' ? value : null;
};

const readGrid = (value: unknown): Slot[][] => {
  return readArray(value).map((row) => readArray(row).map(readSlot));
};

/** The wire's fields, or `null` when the blob is unreadable or another version. */
const parseWire = (encoded: string): WireFields | null => {
  const json = fromBase64Url(encoded);

  if (json === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(json);
    const isObject = typeof parsed === 'object' && parsed !== null;

    if (!isObject || !('v' in parsed) || parsed.v !== SHARE_WIRE_VERSION) {
      return null;
    }

    return parsed as WireFields;
  } catch {
    return null;
  }
};

/** Builds the replay, skipping fields that are missing or the wrong type. */
const createActionList = () => {
  const actions: MeatGrinderAction[] = [];

  const addNumber = (
    type: NumberActionType,
    raw: unknown,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
  ) => {
    const value = readNumber(raw);

    if (value === undefined) {
      return;
    }

    actions.push({ type, value: clamp(value, min, max) });
  };

  const addBoolean = (type: BooleanActionType, raw: unknown) => {
    const value = readBoolean(raw);

    if (value === undefined) {
      return;
    }

    actions.push({ type, value });
  };

  return { actions, addNumber, addBoolean };
};

/**
 * Everything but the plan, ordered so each action sees what bounds it: traits
 * before influence and charge (active bases), damage mods before Ganging Up
 * and Crowding Out (their ranges).
 */
const setupActions = (
  attacker: AttackerData,
  wire: WireFields,
): MeatGrinderAction[] => {
  const { actions, addNumber, addBoolean } = createActionList();

  const traitIds = new Set(
    (attacker.characterTraits ?? []).map((trait) => trait.id),
  );
  const buffIds = new Set(availableBuffs(attacker).map((buff) => buff.id));

  for (const id of readStrings(wire.t)) {
    if (traitIds.has(id)) {
      actions.push({ type: 'activeTrait', id, value: true });
    }
  }

  addNumber('influence', wire.i);
  addBoolean('charging', wire.c);
  addNumber('chargeAttackIndex', wire.ci);

  addNumber('enemyDef', wire.d, DEF_MIN, DEF_MAX);
  addNumber('armor', wire.a, ARM_MIN, ARM_MAX);
  addNumber('hp', wire.h, HP_MIN, HP_MAX);
  addBoolean('enemyHasCover', wire.cv);
  addBoolean('enemyDefensiveStance', wire.ds);
  addBoolean('enemyKnockedDown', wire.kd);
  addBoolean('enemySnared', wire.sn);
  addBoolean('enemyResilience', wire.rs);

  addBoolean('toughHide', wire.th);
  addBoolean('targetBurning', wire.bu);
  addBoolean('assistEngaged', wire.ae);

  for (const id of readStrings(wire.b)) {
    if (buffIds.has(id)) {
      actions.push({ type: 'guildBuff', id, value: true });
    }
  }

  addNumber('startingMomentum', wire.m);
  addNumber('gangingUp', wire.g);
  addNumber('crowdingOut', wire.co);

  return actions;
};

/** One attack's share of the wire, already read and type-checked. */
type AttackReplay = {
  bonusTime: boolean | undefined;
  wrapRow: Slot[];
  playRow: Slot[];
};

/** The wire's per-attack fields, read once and split by attack. */
const attackReplaysOf = (
  wire: WireFields,
  attackCount: number,
): AttackReplay[] => {
  const bonusTimes = readArray(wire.bt);
  const wrapGrid = readGrid(wire.w);
  const playGrid = readGrid(wire.p);

  return Array.from({ length: attackCount }, (_, attackIndex) => {
    return {
      bonusTime: readBoolean(bonusTimes[attackIndex]),
      wrapRow: wrapGrid[attackIndex] ?? [],
      playRow: playGrid[attackIndex] ?? [],
    };
  });
};

/**
 * One attack's Bonus Time, then its picks slot by slot. Slots the current plan
 * does not have, and lines not on the card, are skipped: a pick can only open
 * the next slot once applied.
 */
const replayAttack = (
  state: MeatGrinderState,
  attackIndex: number,
  replay: AttackReplay,
): MeatGrinderState => {
  const { bonusTime, wrapRow, playRow } = replay;

  let next = state;

  if (bonusTime !== undefined) {
    next = meatGrinderReducer(next, {
      type: 'bonusTime',
      attackIndex,
      value: bonusTime,
    });
  }

  const linesById = playbookIndex(attackerOf(state)).byId;

  wrapRow.forEach((id, pickIndex) => {
    const slotCount = next.attackPlan.wrapPicks[attackIndex].length;
    const isKnownSlot = id === null || linesById.has(id);

    if (pickIndex >= slotCount || !isKnownSlot) {
      return;
    }

    next = meatGrinderReducer(next, {
      type: 'wrapChoice',
      attackIndex,
      pickIndex,
      id,
    });

    const play = playRow[pickIndex];

    if (play == null) {
      return;
    }

    next = meatGrinderReducer(next, {
      type: 'characterPlayPick',
      attackIndex,
      pickIndex,
      pick: play,
    });
  });

  return next;
};

/** The model's fresh state with the wire replayed on top. */
const replayWire = (
  attacker: AttackerData,
  wire: WireFields,
): MeatGrinderState => {
  const setup = setupActions(attacker, wire).reduce(
    meatGrinderReducer,
    stateForAttacker(attacker),
  );

  const attackCount = setup.attackPlan.wrapPicks.length;
  const replays = attackReplaysOf(wire, attackCount);

  return replays.reduce(
    (state, replay, attackIndex) => replayAttack(state, attackIndex, replay),
    setup,
  );
};

/**
 * The shared state, or `null` when the link names no known model. A known model
 * with a missing or unreadable blob loads with its defaults.
 */
export const stateFromShareParams = (
  params: URLSearchParams,
): MeatGrinderState | null => {
  const modelId = params.get(SHARE_MODEL_PARAM);
  const attacker = findAttackerById(modelId);

  if (!attacker) {
    return null;
  }

  const encoded = params.get(SHARE_STATE_PARAM) ?? '';
  const wire = parseWire(encoded);

  if (!wire) {
    return stateForAttacker(attacker);
  }

  return replayWire(attacker, wire);
};
