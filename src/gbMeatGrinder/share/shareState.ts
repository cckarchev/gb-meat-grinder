/**
 * Share links: the selected model in plain text plus every other choice packed
 * into one versioned base64url blob. Decoding replays the blob as reducer
 * actions on the model's fresh state, so a stale or tampered link goes through
 * the same validation and clamping as clicks in the UI.
 */

import { availableBuffs } from '@/core/damage/damage';
import { playbookIndex } from '@/core/playbook/playbookIndex';
import { fromBase64Url, toBase64Url } from '@/core/shared/base64Url';
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
import { ATTACKERS } from '@/data/attackers/registry';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';

export const SHARE_MODEL_PARAM = 'model';
export const SHARE_STATE_PARAM = 's';

const SHARE_WIRE_VERSION = 1;

type Slot = string | null;

/** Short keys keep the link short; every field but `v` is optional on decode. */
type ShareWire = {
  v: number;
  /** Enemy DEF, ARM, HP. */
  d: number;
  a: number;
  h: number;
  /** Influence, charging, charge row. */
  i: number;
  c: boolean;
  ci: number;
  /** Cover, Defensive Stance, Knocked Down, Snared, Resilience. */
  cv: boolean;
  ds: boolean;
  kd: boolean;
  sn: boolean;
  rs: boolean;
  /** Starting momentum, Ganging Up, Crowding Out. */
  m: number;
  g: number;
  co: number;
  /** Tough Hide, Burning, Assist engaged. */
  th: boolean;
  bu: boolean;
  ae: boolean;
  /** Ids of the active guild buffs and character traits. */
  b: string[];
  t: string[];
  /** Bonus Time per attack, wrap picks and character plays per attack. */
  bt: boolean[];
  w: Slot[][];
  p: Slot[][];
};

const activeIds = (flags: Record<string, boolean>): string[] => {
  return Object.keys(flags).filter((id) => flags[id]);
};

/** Empty slots at the end of a row replay as no-ops, so they are left out. */
const withoutTrailingEmptySlots = (row: readonly Slot[]): Slot[] => {
  let keptCount = row.length;

  while (keptCount > 0 && row[keptCount - 1] === null) {
    keptCount--;
  }

  return row.slice(0, keptCount);
};

const wireOf = (state: MeatGrinderState): ShareWire => {
  return {
    v: SHARE_WIRE_VERSION,
    d: state.enemyDef,
    a: state.armor,
    h: state.hp,
    i: state.influence,
    c: state.charging,
    ci: state.chargeAttackIndex,
    cv: state.enemyHasCover,
    ds: state.enemyDefensiveStance,
    kd: state.enemyKnockedDown,
    sn: state.enemySnared,
    rs: state.enemyResilience,
    m: state.startingMomentum,
    g: state.gangingUp,
    co: state.crowdingOut,
    th: state.damageMods.toughHide,
    bu: state.damageMods.targetBurning,
    ae: state.damageMods.assistEngaged,
    b: activeIds(state.damageMods.buffs),
    t: activeIds(state.activeTraits),
    bt: state.bonusTimeByAttack,
    w: state.attackPlan.wrapPicks.map(withoutTrailingEmptySlots),
    p: state.attackPlan.characterPlayPicks.map(withoutTrailingEmptySlots),
  };
};

type WireValue = ShareWire[keyof ShareWire];

const sameWireValue = (a: unknown, b: unknown): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

/** `items` without the trailing entries that match `defaults` index by index. */
const withoutTrailingDefaults = (
  items: readonly unknown[],
  defaults: readonly unknown[],
): unknown[] => {
  let keptCount = items.length;

  while (
    keptCount > 0 &&
    sameWireValue(items[keptCount - 1], defaults[keptCount - 1])
  ) {
    keptCount--;
  }

  return items.slice(0, keptCount);
};

/** The part of `value` a decoder starting from `defaultValue` needs, or `undefined`. */
const wireDelta = (value: WireValue, defaultValue: WireValue): unknown => {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    const kept = withoutTrailingDefaults(value, defaultValue);

    return kept.length > 0 ? kept : undefined;
  }

  return sameWireValue(value, defaultValue) ? undefined : value;
};

/**
 * Only the fields that differ from the model's fresh state; the decoder starts
 * from that same state, so whatever is left out comes back as the default.
 */
const compactWire = (wire: ShareWire, defaults: ShareWire): WireFields => {
  const compact: WireFields = { v: SHARE_WIRE_VERSION };
  const keys = Object.keys(wire) as (keyof ShareWire)[];

  for (const key of keys) {
    const delta = wireDelta(wire[key], defaults[key]);

    if (delta !== undefined) {
      compact[key] = delta;
    }
  }

  return compact;
};

/** The model in plain text, plus the encoded choices when any differ from its defaults. */
export const shareParamsOf = (state: MeatGrinderState): URLSearchParams => {
  const defaults = stateForAttacker(attackerOf(state));
  const compact = compactWire(wireOf(state), wireOf(defaults));
  const params = new URLSearchParams({ [SHARE_MODEL_PARAM]: state.attackerId });
  const hasChoices = Object.keys(compact).some((key) => key !== 'v');

  if (hasChoices) {
    params.set(SHARE_STATE_PARAM, toBase64Url(JSON.stringify(compact)));
  }

  return params;
};

type WireFields = Partial<Record<keyof ShareWire, unknown>>;

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

type NumberActionType =
  | 'enemyDef'
  | 'armor'
  | 'hp'
  | 'influence'
  | 'chargeAttackIndex'
  | 'startingMomentum'
  | 'gangingUp'
  | 'crowdingOut';

type BooleanActionType =
  | 'charging'
  | 'enemyHasCover'
  | 'enemyDefensiveStance'
  | 'enemyKnockedDown'
  | 'enemySnared'
  | 'enemyResilience'
  | 'toughHide'
  | 'targetBurning'
  | 'assistEngaged';

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

/**
 * One attack's Bonus Time, then its picks slot by slot. Slots the current plan
 * does not have, and lines not on the card, are skipped: a pick can only open
 * the next slot once applied.
 */
const replayAttack = (
  state: MeatGrinderState,
  attackIndex: number,
  wire: WireFields,
): MeatGrinderState => {
  const bonusTime = readBoolean(readArray(wire.bt)[attackIndex]);
  const wrapRow = readGrid(wire.w)[attackIndex] ?? [];
  const playRow = readGrid(wire.p)[attackIndex] ?? [];

  let next = state;

  if (bonusTime !== undefined) {
    next = meatGrinderReducer(next, {
      type: 'bonusTime',
      attackIndex,
      value: bonusTime,
    });
  }

  const lineIds = playbookIndex(attackerOf(state)).byId;

  wrapRow.forEach((id, pickIndex) => {
    const slotCount = next.attackPlan.wrapPicks[attackIndex].length;
    const isKnownSlot = id === null || lineIds.has(id);

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
  let state = setup;

  for (let attackIndex = 0; attackIndex < attackCount; attackIndex++) {
    state = replayAttack(state, attackIndex, wire);
  }

  return state;
};

/**
 * The shared state, or `null` when the link names no known model. A known model
 * with a missing or unreadable blob loads with its defaults.
 */
export const stateFromShareParams = (
  params: URLSearchParams,
): MeatGrinderState | null => {
  const modelId = params.get(SHARE_MODEL_PARAM);
  const attacker = ATTACKERS.find((candidate) => candidate.id === modelId);

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
