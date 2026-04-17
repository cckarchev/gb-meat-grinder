/**
 * Veteran Boar playbook: columns in card order. Each column needs `netSuccesses`
 * after ARM; `results` has 1–2 lines (a `|` on the card = two entries here).
 */

import { BASE_ATTACK_COUNT, MAX_ATTACK_COUNT } from './constants';

export type PlaybookChoiceId =
  | 'push'
  | 'dmg1'
  | 'gb'
  | 'dmg2'
  | 'kd'
  | 'push_push'
  | 'dmg3'
  | 'one_gb'
  | 'tackle'
  | 'dmg5'
  | 'dmg6';

/** One wrap slot: a line, or empty (ignored for damage / chain / GB). */
export type WrapPick = PlaybookChoiceId | null;

/** Singled Out vs Stagger after GB or 1GB (each can apply once per activation). */
export type GbFollowUp = 'so' | 'stagger';

/** Which GB follow-ups have already been taken on earlier attacks (same activation). */
export type GbUsage = { so: boolean; stagger: boolean };

export type PlaybookResult = {
  id: PlaybookChoiceId;
  label: string;
  /** +TAC on later attacks (Singled Out); from follow-up when using GB / 1GB. */
  tacBonusForLater: number;
  /** −enemy DEF on later attacks (KD / Stagger). */
  defReductionForLater: number;
  /** Damage to enemy HP when this attack hits with this line. */
  damage: number;
  /** True if this line generates momentum (momentous). */
  momentum?: boolean;
  /** After GB / 1GB, pick Singled Out or Stagger (once each per activation). */
  picksGbFollowUp?: boolean;
};

export type PlaybookColumn = {
  netSuccesses: number;
  results:
    | readonly [PlaybookResult]
    | readonly [PlaybookResult, PlaybookResult];
};

export const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'push',
        label: '>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
      },
      {
        id: 'dmg1',
        label: '1',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 1,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'gb',
        label: 'GB',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        picksGbFollowUp: true,
      },
      {
        id: 'dmg2',
        label: '2',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 2,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'kd',
        label: 'KD',
        tacBonusForLater: 0,
        defReductionForLater: 1,
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'push_push',
        label: '>>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
      },
      {
        id: 'dmg3',
        label: '3',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 3,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'one_gb',
        label: '1GB',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 1,
        picksGbFollowUp: true,
      },
      {
        id: 'tackle',
        label: 'T',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'dmg5',
        label: '5',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 5,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 7,
    results: [
      {
        id: 'dmg6',
        label: '6',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 6,
        momentum: true,
      },
    ],
  },
] as const;

/** Largest column cost on the card; wrap reserves this much net per “full” step. */
export const MAX_PLAYBOOK_NET = Math.max(
  ...PLAYBOOK.map((c) => c.netSuccesses),
);

const byId = new Map<PlaybookChoiceId, PlaybookResult>();
for (const col of PLAYBOOK) {
  for (const r of col.results) {
    byId.set(r.id, r);
  }
}

export function getPlaybookResult(id: PlaybookChoiceId): PlaybookResult {
  const r = byId.get(id);
  if (!r) throw new Error(`Unknown playbook id: ${id}`);
  return r;
}

/** Rows 0–2: charge + two bought attacks. Rows 3–5: berserkers for bases 0–2. */
export function attackRowIsBerserker(attackIndex: number): boolean {
  return attackIndex >= BASE_ATTACK_COUNT;
}

export function berserkerSourceBaseIndex(attackIndex: number): number {
  return attackIndex - BASE_ATTACK_COUNT;
}

/** True if this base attack includes any non-null wrap line with damage > 0. */
export function baseAttackDealtDamage(picks: WrapPick[]): boolean {
  return picks.some(
    (id) => id != null && getPlaybookResult(id).damage > 0,
  );
}

/** Berserker rows are active only when their source base dealt damage; bases always active. */
export function attackRowIsActive(
  wrapPicks: WrapPick[][],
  attackIndex: number,
): boolean {
  if (attackIndex < BASE_ATTACK_COUNT) return true;
  const b = berserkerSourceBaseIndex(attackIndex);
  return baseAttackDealtDamage(wrapPicks[b] ?? []);
}

/**
 * Swing order: each base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked — they always resolve immediately after the base that earned them.
 */
export function activationAttackIndices(wrapPicks: WrapPick[][]): number[] {
  const out: number[] = [];
  for (let b = 0; b < BASE_ATTACK_COUNT; b++) {
    out.push(b);
    const ber = BASE_ATTACK_COUNT + b;
    if (attackRowIsActive(wrapPicks, ber)) out.push(ber);
  }
  return out;
}

export function choiceUsesGbFollowUp(id: WrapPick): id is PlaybookChoiceId {
  if (id == null) return false;
  return getPlaybookResult(id).picksGbFollowUp === true;
}

export function gbFollowUpModifiers(follow: GbFollowUp): {
  tacBonusForLater: number;
  defReductionForLater: number;
} {
  if (follow === 'so') return { tacBonusForLater: 2, defReductionForLater: 0 };
  return { tacBonusForLater: 0, defReductionForLater: 1 };
}

/** Per-pick GB follow-up slot; `null` when that pick is not GB / 1GB. */
export type GbFollowUpSlot = GbFollowUp | null;

/**
 * SO / Stagger already taken on picks strictly before `(attackIndex, pickIndex)`
 * in activation order (base then its berserker, then next base, …).
 */
export function gbFollowUpUsageBeforePick(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
  pickIndex: number,
): GbUsage {
  let so = false;
  let stagger = false;
  const order = activationAttackIndices(wrapPicks);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return { so, stagger };

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];
      if (id == null || !choiceUsesGbFollowUp(id)) continue;
      const f = gbFollowUps[j]?.[k] ?? 'so';
      if (f === 'so') so = true;
      else stagger = true;
    }
  }
  return { so, stagger };
}

/** True if Knock Down was already taken on a strictly earlier wrap pick (activation order). */
export function kdAlreadyTakenBeforePick(
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
): boolean {
  const order = activationAttackIndices(wrapPicks);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return false;

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      if (wrapPicks[j][k] === 'kd') return true;
    }
  }
  return false;
}

/**
 * Modifiers this pick adds to later swings (SO/Stagger each once; after both,
 * further GB / 1GB lines have no follow-up effect).
 */
export function rowEffectsForPick(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
  pickIndex: number,
): { tacBonusForLater: number; defReductionForLater: number } {
  const id = wrapPicks[attackIndex][pickIndex];
  if (id == null) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (
    id === 'kd' &&
    kdAlreadyTakenBeforePick(wrapPicks, attackIndex, pickIndex)
  ) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (!choiceUsesGbFollowUp(id)) {
    const b = getPlaybookResult(id);
    return {
      tacBonusForLater: b.tacBonusForLater,
      defReductionForLater: b.defReductionForLater,
    };
  }
  const u = gbFollowUpUsageBeforePick(
    wrapPicks,
    gbFollowUps,
    attackIndex,
    pickIndex,
  );
  if (u.so && u.stagger) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  const f = gbFollowUps[attackIndex]?.[pickIndex] ?? 'so';
  if (f === 'stagger' && u.stagger) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (f === 'so' && u.so) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  return gbFollowUpModifiers(f);
}

/** Which follow-ups can still be chosen on this pick (before resolving it). */
export function gbFollowUpAvailabilityForPick(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
  pickIndex: number,
): { canPickSo: boolean; canPickStagger: boolean; depleted: boolean } {
  const u = gbFollowUpUsageBeforePick(
    wrapPicks,
    gbFollowUps,
    attackIndex,
    pickIndex,
  );
  if (u.so && u.stagger) {
    return { canPickSo: false, canPickStagger: false, depleted: true };
  }
  return {
    canPickSo: !u.so,
    canPickStagger: !u.stagger,
    depleted: false,
  };
}

/** Fix illegal follow-ups when earlier picks consumed SO or Stagger. */
export function sanitizeGbFollowUpsWrap(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
): { gb: GbFollowUpSlot[][]; changed: boolean } {
  const next: GbFollowUpSlot[][] = gbFollowUps.map((row) => [...row]);
  let changed = false;
  for (let i = 0; i < wrapPicks.length; i++) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      if (wrapPicks[i][k] == null || !choiceUsesGbFollowUp(wrapPicks[i][k])) {
        if (next[i]?.[k] != null) {
          next[i][k] = null;
          changed = true;
        }
        continue;
      }
      const u = gbFollowUpUsageBeforePick(wrapPicks, next, i, k);
      if (u.so && u.stagger) continue;
      let f = next[i][k] ?? 'so';
      if (u.stagger && f === 'stagger') {
        f = 'so';
        next[i][k] = f;
        changed = true;
      }
      f = next[i][k] ?? 'so';
      if (u.so && f === 'so') {
        next[i][k] = 'stagger';
        changed = true;
      }
    }
  }
  return { gb: next, changed };
}

export function netSuccessesForChoice(id: PlaybookChoiceId): number {
  const col = PLAYBOOK.find((c) => c.results.some((r) => r.id === id));
  if (!col) throw new Error(`No column for id ${id}`);
  return col.netSuccesses;
}

/** Total net successes spent on one attack’s wrap (sum of column costs). */
export function wrapNetCostSum(picks: WrapPick[]): number {
  return picks.reduce(
    (s, id) => s + (id == null ? 0 : netSuccessesForChoice(id)),
    0,
  );
}

/** How many playbook results this attack can resolve (ceil(maxNet / card cap)). */
export function wrapSlotCount(maxNet: number): number {
  if (maxNet < 1) return 1;
  return Math.ceil(maxNet / MAX_PLAYBOOK_NET);
}

/**
 * Max net for slot `slotIndex` (0-based): each full card-width step consumes
 * `MAX_PLAYBOOK_NET`; leftover is the cap for the next result — not based on
 * what you picked in the previous slot.
 */
export function wrapSlotBudget(maxNet: number, slotIndex: number): number {
  const raw = maxNet - slotIndex * MAX_PLAYBOOK_NET;
  if (raw < 1) return 0;
  return Math.min(MAX_PLAYBOOK_NET, raw);
}

/**
 * Total net successes needed on the roll for this slot’s column, treating later
 * wrap slots as continuing past the card’s widest column (8th, 9th, …).
 */
export function wrapExtendedNetNeeded(
  slotIndex: number,
  columnNet: number,
): number {
  return slotIndex * MAX_PLAYBOOK_NET + columnNet;
}

export function defaultGbFollowUpsWrap(): GbFollowUpSlot[][] {
  return Array.from({ length: MAX_ATTACK_COUNT }, () => [null]);
}

export function defaultWrapPicks(): WrapPick[][] {
  return Array.from({ length: MAX_ATTACK_COUNT }, () => [
    PLAYBOOK[0].results[0].id,
  ]);
}

/** Damage per attack if every pick on that attack hits. */
export function damageIfAllHitsWrap(wrapPicks: WrapPick[][]): number[] {
  return wrapPicks.map((picks, i) =>
    attackRowIsActive(wrapPicks, i)
      ? picks.reduce(
          (s, id) => s + (id == null ? 0 : getPlaybookResult(id).damage),
          0,
        )
      : 0,
  );
}

export function totalDamageIfAllHits(wrapPicks: WrapPick[][]): number {
  return damageIfAllHitsWrap(wrapPicks).reduce((a, b) => a + b, 0);
}

export function attackDealtDamageFlags(wrapPicks: WrapPick[][]): boolean[] {
  return damageIfAllHitsWrap(wrapPicks).map((d) => d > 0);
}
