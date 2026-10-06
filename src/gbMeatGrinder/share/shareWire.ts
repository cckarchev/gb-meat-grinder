/**
 * Share links, encoding side: the selected model in plain text plus every
 * choice that differs from its defaults, packed into one versioned base64url
 * blob.
 */

import { toBase64Url } from '@/core/shared/base64Url';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';

export const SHARE_MODEL_PARAM = 'model';
export const SHARE_STATE_PARAM = 's';

export const SHARE_WIRE_VERSION = 1;

/** A wrap pick or character play id, or an empty slot. */
export type Slot = string | null;

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

/** A partial wire: the compact one written to a link, or whatever a link holds. */
export type WireFields = Partial<Record<keyof ShareWire, unknown>>;

const activeIds = (flags: Record<string, boolean>): string[] => {
  return Object.keys(flags).filter((id) => flags[id]);
};

/** `items` without the run of trailing entries `isDroppable` accepts. */
const withoutTrailing = <T>(
  items: readonly T[],
  isDroppable: (item: T, index: number) => boolean,
): T[] => {
  let keptCount = items.length;

  while (keptCount > 0) {
    const lastIndex = keptCount - 1;

    if (!isDroppable(items[lastIndex], lastIndex)) {
      break;
    }

    keptCount = lastIndex;
  }

  return items.slice(0, keptCount);
};

/** Empty slots at the end of a row replay as no-ops, so they are left out. */
const withoutTrailingEmptySlots = (row: readonly Slot[]): Slot[] => {
  return withoutTrailing(row, (slot) => slot === null);
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

/** The part of `value` a decoder starting from `defaultValue` needs, or `undefined`. */
const wireDelta = (value: WireValue, defaultValue: WireValue): unknown => {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    // Trailing entries that match the defaults index by index are left out.
    const kept = withoutTrailing<unknown>(value, (item, index) => {
      return sameWireValue(item, defaultValue[index]);
    });

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
