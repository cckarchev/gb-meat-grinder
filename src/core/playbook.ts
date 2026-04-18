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
export type CharacterPlayPick = 'so' | 'stagger';

/** Which character-play picks have already been used on earlier swings (same activation). */
export type CharacterPlayUsage = { so: boolean; stagger: boolean };

export type PlaybookResult = {
  id: PlaybookChoiceId;
  label: string;
  /** +TAC on later attacks (Singled Out); from character play when using GB / 1GB. */
  tacBonusForLater: number;
  /** −enemy DEF on later attacks (KD / Stagger). */
  defReductionForLater: number;
  /** Damage to enemy HP when this attack hits with this line. */
  damage: number;
  /** True if this line generates momentum (momentous). */
  momentum?: boolean;
  /** After GB / 1GB, pick Singled Out or Stagger (once each per activation). */
  picksCharacterPlay?: boolean;
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
        picksCharacterPlay: true,
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
        picksCharacterPlay: true,
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

export type PlaybookDamageMods = {
  /** Enemy Tough Hide: −1 to each **selected** playbook damage pip. */
  toughHide: boolean;
  tooledUp: boolean;
  theOwner: boolean;
};

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  tooledUp: false,
  theOwner: false,
};

export function playbookDamageBonusSum(mods: PlaybookDamageMods): number {
  return (mods.tooledUp ? 1 : 0) + (mods.theOwner ? 1 : 0);
}

export function effectivePlaybookDamage(
  cardDamage: number,
  mods: PlaybookDamageMods,
): number {
  const pen = mods.toughHide ? 1 : 0;
  return Math.max(0, cardDamage - pen + playbookDamageBonusSum(mods));
}

export function effectiveDamageForChoice(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): number {
  return effectivePlaybookDamage(getPlaybookResult(id).damage, mods);
}

/** Playbook line button look for momentous damage pips (after Tough Hide / buffs). */
export type MomentousLineStyle = 'heat' | 'zeroed' | 'none';

export function momentousLineStyle(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle {
  const r = getPlaybookResult(id);
  if (r.momentum !== true) return 'none';
  return effectiveDamageForChoice(id, mods) > 0 ? 'heat' : 'zeroed';
}

export function wrapPickClearsCover(id: WrapPick | null | undefined): boolean {
  return id === 'push' || id === 'push_push';
}

/**
 * Fixed GB swing order for cover: each base then its berserker, regardless of
 * whether the berserker row is “active” for damage (so > / >> are never skipped).
 */
export function coverSwingClockIndices(): number[] {
  const out: number[] = [];
  for (let b = 0; b < BASE_ATTACK_COUNT; b++) {
    out.push(b, BASE_ATTACK_COUNT + b);
  }
  return out;
}

/**
 * Playbook button text: plain numeric pips (label matches damage) show the
 * **effective** value; lines like 1GB keep the **printed** label.
 */
export function playbookLineDisplayLabel(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string {
  const r = getPlaybookResult(id);
  if (r.damage > 0 && r.label === String(r.damage)) {
    return String(effectiveDamageForChoice(id, mods));
  }
  return r.label;
}

/** Rows 0–2: charge + two bought attacks. Rows 3–5: berserkers for bases 0–2. */
export function attackRowIsBerserker(attackIndex: number): boolean {
  return attackIndex >= BASE_ATTACK_COUNT;
}

export function berserkerSourceBaseIndex(attackIndex: number): number {
  return attackIndex - BASE_ATTACK_COUNT;
}

/** True if this base attack includes any non-null wrap line with modified playbook damage > 0. */
export function baseAttackDealtDamage(
  picks: WrapPick[],
  damageMods: PlaybookDamageMods,
): boolean {
  return picks.some(
    (id) => id != null && effectiveDamageForChoice(id, damageMods) > 0,
  );
}

/** Berserker rows are active only when their source base dealt damage; bases always active. */
export function attackRowIsActive(
  wrapPicks: WrapPick[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
): boolean {
  if (attackIndex < BASE_ATTACK_COUNT) return true;
  const b = berserkerSourceBaseIndex(attackIndex);
  return baseAttackDealtDamage(wrapPicks[b] ?? [], damageMods);
}

/**
 * Swing order: each base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked — they always resolve immediately after the base that earned them.
 */
export function activationAttackIndices(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
): number[] {
  const out: number[] = [];
  for (let b = 0; b < BASE_ATTACK_COUNT; b++) {
    out.push(b);
    const ber = BASE_ATTACK_COUNT + b;
    if (attackRowIsActive(wrapPicks, ber, damageMods)) out.push(ber);
  }
  return out;
}

export function choiceUsesCharacterPlay(id: WrapPick): id is PlaybookChoiceId {
  if (id == null) return false;
  return getPlaybookResult(id).picksCharacterPlay === true;
}

export function characterPlayPickModifiers(pick: CharacterPlayPick): {
  tacBonusForLater: number;
  defReductionForLater: number;
} {
  if (pick === 'so') return { tacBonusForLater: 2, defReductionForLater: 0 };
  return { tacBonusForLater: 0, defReductionForLater: 1 };
}

/** Per-pick character play slot; `null` when that pick is not GB / 1GB. */
export type CharacterPlayPickSlot = CharacterPlayPick | null;

/**
 * SO / Stagger already taken on picks strictly before `(attackIndex, pickIndex)`
 * in activation order (base then its berserker, then next base, …).
 */
export function characterPlayUsageBeforePick(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
): CharacterPlayUsage {
  let so = false;
  let stagger = false;
  const order = activationAttackIndices(wrapPicks, damageMods);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return { so, stagger };

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];
      if (id == null || !choiceUsesCharacterPlay(id)) continue;
      const f = characterPlayPicks[j]?.[k] ?? 'so';
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
  damageMods: PlaybookDamageMods,
): boolean {
  const order = activationAttackIndices(wrapPicks, damageMods);
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
 * further GB / 1GB lines have no character-play effect).
 */
export function rowEffectsForPick(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
): { tacBonusForLater: number; defReductionForLater: number } {
  const id = wrapPicks[attackIndex][pickIndex];
  if (id == null) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (
    id === 'kd' &&
    kdAlreadyTakenBeforePick(wrapPicks, attackIndex, pickIndex, damageMods)
  ) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (!choiceUsesCharacterPlay(id)) {
    const b = getPlaybookResult(id);
    return {
      tacBonusForLater: b.tacBonusForLater,
      defReductionForLater: b.defReductionForLater,
    };
  }
  const u = characterPlayUsageBeforePick(
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
  );
  if (u.so && u.stagger) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  const f = characterPlayPicks[attackIndex]?.[pickIndex] ?? 'so';
  if (f === 'stagger' && u.stagger) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (f === 'so' && u.so) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  return characterPlayPickModifiers(f);
}

/** Which character-play options can still be chosen on this pick (before resolving it). */
export function characterPlayAvailabilityForPick(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
): { canPickSo: boolean; canPickStagger: boolean; depleted: boolean } {
  const u = characterPlayUsageBeforePick(
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
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

/** Fix illegal character-play rows when earlier picks consumed SO or Stagger. */
export function sanitizeCharacterPlayPicksWrap(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
): { characterPlayPicks: CharacterPlayPickSlot[][]; changed: boolean } {
  const next: CharacterPlayPickSlot[][] = characterPlayPicks.map((row) => [
    ...row,
  ]);
  let changed = false;
  for (let i = 0; i < wrapPicks.length; i++) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      if (wrapPicks[i][k] == null || !choiceUsesCharacterPlay(wrapPicks[i][k])) {
        if (next[i]?.[k] != null) {
          next[i][k] = null;
          changed = true;
        }
        continue;
      }
      const u = characterPlayUsageBeforePick(wrapPicks, next, i, k, damageMods);
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
  return { characterPlayPicks: next, changed };
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

export function defaultCharacterPlayPicksWrap(): CharacterPlayPickSlot[][] {
  return Array.from({ length: MAX_ATTACK_COUNT }, () => [null]);
}

export function defaultWrapPicks(): WrapPick[][] {
  return Array.from({ length: MAX_ATTACK_COUNT }, () => [
    PLAYBOOK[0].results[0].id,
  ]);
}

/** Damage per attack if every pick on that attack hits (playbook modifiers applied). */
export function damageIfAllHitsWrap(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
): number[] {
  return wrapPicks.map((picks, i) =>
    attackRowIsActive(wrapPicks, i, damageMods)
      ? picks.reduce(
          (s, id) =>
            s + (id == null ? 0 : effectiveDamageForChoice(id, damageMods)),
          0,
        )
      : 0,
  );
}

export function totalDamageIfAllHits(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
): number {
  return damageIfAllHitsWrap(wrapPicks, damageMods).reduce((a, b) => a + b, 0);
}

export function attackDealtDamageFlags(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
): boolean[] {
  return damageIfAllHitsWrap(wrapPicks, damageMods).map((d) => d > 0);
}
