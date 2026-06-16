/**
 * Playbook + wrap / character-play helpers. The playbook columns and damage
 * buffs come from the active attacker's data; attack-row layout and activation
 * order are derived from the attacker's traits plus the influence allocated
 * (`activeBaseCount`), not from fixed constants.
 */

import { activeAttacker } from '@/attackers/activeAttacker';
import { attackArraySize, berserkerRowOffset } from '@/core/attackStructure';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  CharacterPlayUsage,
  DamageModifierBreakdown,
  MomentousLineStyle,
  PlaybookChoiceId,
  PlaybookColumn,
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/types/core/playbook';

/** The active attacker's playbook, in card order. */
export const PLAYBOOK: readonly PlaybookColumn[] = activeAttacker.playbook;

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

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  buffs: {},
};

/** Sum of the active attacker's damage buffs that are currently selected. */
export function playbookDamageBonusSum(mods: PlaybookDamageMods): number {
  let sum = 0;
  for (const buff of activeAttacker.damageBuffs) {
    if (mods.buffs[buff.id]) sum += buff.damageBonus;
  }
  return sum;
}

export function effectivePlaybookDamage(
  cardDamage: number,
  mods: PlaybookDamageMods,
): number {
  if (cardDamage <= 0) {
    return 0;
  }
  const pen = mods.toughHide ? 1 : 0;
  return Math.max(0, cardDamage - pen + playbookDamageBonusSum(mods));
}

export function effectiveDamageForChoice(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): number {
  return effectivePlaybookDamage(getPlaybookResult(id).damage, mods);
}

export function momentousLineStyle(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle {
  const r = getPlaybookResult(id);
  if (r.momentum !== true) return 'none';
  return effectiveDamageForChoice(id, mods) > 0 ? 'heat' : 'zeroed';
}

/**
 * True when this pick earns momentum on a hit: momentous on the card **and**
 * effective damage greater than 0 (same rule as the red playbook chip; Tough Hide can zero it out).
 */
export function pickGeneratesMomentum(
  id: WrapPick | null | undefined,
  mods: PlaybookDamageMods,
): boolean {
  if (id == null) return false;
  return momentousLineStyle(id, mods) === 'heat';
}

function bonusTimeSpent(
  attackIndex: number,
  bonusTimeByAttack: readonly boolean[],
): boolean {
  return bonusTimeByAttack[attackIndex] === true;
}

/**
 * Momentum available **before** this attack’s roll (after prior attacks’ heat
 * picks and their Bonus Time spends, not including this attack’s wrap or spend).
 */
export function momentumPoolBeforeBonusTime(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number {
  const order = activationAttackIndices(wrapPicks, damageMods, activeBaseCount);
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(id, damageMods)) total += 1;
      }
    }
    if (bonusTimeSpent(j, bonusTimeByAttack)) total -= 1;
  }
  return total;
}

/**
 * Total momentum after this attack in activation order: starting momentum,
 * plus heat picks through this attack, minus Bonus Time spends through this attack.
 * Earned momentum is not capped at 20.
 */
export function momentumAfterAttackInclusive(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number {
  const order = activationAttackIndices(wrapPicks, damageMods, activeBaseCount);
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi <= pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(id, damageMods)) total += 1;
      }
    }
    if (bonusTimeSpent(j, bonusTimeByAttack)) total -= 1;
  }
  return total;
}

/** Clears Bonus Time flags that can no longer be paid (pool less than 1 before that swing). */
export function sanitizeBonusTimeFlags(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): boolean[] {
  const order = activationAttackIndices(wrapPicks, damageMods, activeBaseCount);
  const next = bonusTimeByAttack.map((b) => b);
  for (let iter = 0; iter < order.length + 2; iter++) {
    let changed = false;
    for (const i of order) {
      if (!next[i]) continue;
      const pool = momentumPoolBeforeBonusTime(
        wrapPicks,
        damageMods,
        i,
        startingMomentum,
        next,
        activeBaseCount,
      );
      if (pool < 1) {
        next[i] = false;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return next;
}

export function wrapPickClearsCover(id: WrapPick | null | undefined): boolean {
  return id === 'push' || id === 'push_push';
}

/**
 * Fixed GB swing order for cover: each base then its berserker, regardless of
 * whether the berserker row is “active” for damage (so > / >> are never skipped).
 */
export function coverSwingClockIndices(activeBaseCount: number): number[] {
  const out: number[] = [];
  const offset = berserkerRowOffset();
  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);
    if (activeAttacker.berserker) out.push(offset + b);
  }
  return out;
}

/**
 * Playbook button text: plain numeric pips (label matches damage) show the
 * **effective** value; **GB** is always the letters “GB”; **1GB** uses effective
 * damage as **0GB**, **1GB**, **2GB**, …
 */
export function playbookLineDisplayLabel(
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string {
  const r = getPlaybookResult(id);
  if (id === 'gb') {
    return r.label;
  }
  if (id === 'one_gb') {
    return `${effectiveDamageForChoice(id, mods)}GB`;
  }
  if (r.damage > 0 && r.label === String(r.damage)) {
    return String(effectiveDamageForChoice(id, mods));
  }
  return r.label;
}

/** Selected playbook lines on one attack row, for summaries (e.g. `> → 2 → GB`). */
export function formatWrapRowSelectionLabel(
  picks: readonly WrapPick[],
  damageMods: PlaybookDamageMods,
): string {
  const labels: string[] = [];
  for (const id of picks) {
    if (id == null) continue;
    labels.push(playbookLineDisplayLabel(id, damageMods));
  }
  return labels.length > 0 ? labels.join(' → ') : '-';
}

/** Rows below the berserker offset are base attacks; at/above it are berserkers. */
export function attackRowIsBerserker(attackIndex: number): boolean {
  return attackIndex >= berserkerRowOffset();
}

export function berserkerSourceBaseIndex(attackIndex: number): number {
  return attackIndex - berserkerRowOffset();
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

/**
 * Base rows are active while their index is within the allocated base count;
 * berserker rows are active only for Berserker models when their source base is
 * active and dealt damage.
 */
export function attackRowIsActive(
  wrapPicks: WrapPick[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): boolean {
  const offset = berserkerRowOffset();
  if (attackIndex < offset) {
    return attackIndex < activeBaseCount;
  }
  if (!activeAttacker.berserker) return false;
  const b = berserkerSourceBaseIndex(attackIndex);
  if (b < 0 || b >= activeBaseCount) return false;
  return baseAttackDealtDamage(wrapPicks[b] ?? [], damageMods);
}

/**
 * Swing order: each active base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked; they always resolve immediately after the base that earned them.
 */
export function activationAttackIndices(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] {
  const out: number[] = [];
  const offset = berserkerRowOffset();
  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);
    if (!activeAttacker.berserker) continue;
    const ber = offset + b;
    if (attackRowIsActive(wrapPicks, ber, damageMods, activeBaseCount)) {
      out.push(ber);
    }
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
  activeBaseCount: number,
): CharacterPlayUsage {
  let so = false;
  let stagger = false;
  const order = activationAttackIndices(wrapPicks, damageMods, activeBaseCount);
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
  activeBaseCount: number,
): boolean {
  const order = activationAttackIndices(wrapPicks, damageMods, activeBaseCount);
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
  activeBaseCount: number,
): { tacBonusForLater: number; defReductionForLater: number } {
  const id = wrapPicks[attackIndex][pickIndex];
  if (id == null) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (
    id === 'kd' &&
    kdAlreadyTakenBeforePick(
      wrapPicks,
      attackIndex,
      pickIndex,
      damageMods,
      activeBaseCount,
    )
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
    activeBaseCount,
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
  activeBaseCount: number,
): { canPickSo: boolean; canPickStagger: boolean; depleted: boolean } {
  const u = characterPlayUsageBeforePick(
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
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
  activeBaseCount: number,
): { characterPlayPicks: CharacterPlayPickSlot[][]; changed: boolean } {
  const next: CharacterPlayPickSlot[][] = characterPlayPicks.map((row) => [
    ...row,
  ]);
  let changed = false;
  for (let i = 0; i < wrapPicks.length; i++) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      if (
        wrapPicks[i][k] == null ||
        !choiceUsesCharacterPlay(wrapPicks[i][k])
      ) {
        if (next[i]?.[k] != null) {
          next[i][k] = null;
          changed = true;
        }
        continue;
      }
      const u = characterPlayUsageBeforePick(
        wrapPicks,
        next,
        i,
        k,
        damageMods,
        activeBaseCount,
      );
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

/** How many playbook results this attack can resolve (ceil(maxNet / card cap)). */
export function wrapSlotCount(maxNet: number): number {
  if (maxNet < 1) return 1;
  return Math.ceil(maxNet / MAX_PLAYBOOK_NET);
}

/**
 * Max net for slot `slotIndex` (0-based): each full card-width step consumes
 * `MAX_PLAYBOOK_NET`; leftover is the cap for the next result, not based on
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

/**
 * Net successes the pool must reach so every non-null wrap pick resolves,
 * using the same extended indexing as the playbook UI. Not a naive sum of
 * column costs: later wrap slots count past the card width.
 */
export function wrapNetThresholdAllHits(picks: readonly WrapPick[]): number {
  let maxNeed = 0;
  for (let k = 0; k < picks.length; k++) {
    const id = picks[k];
    if (id == null) continue;
    const need = wrapExtendedNetNeeded(k, netSuccessesForChoice(id));
    if (need > maxNeed) maxNeed = need;
  }
  return maxNeed;
}

export function defaultCharacterPlayPicksWrap(): CharacterPlayPickSlot[][] {
  return Array.from({ length: attackArraySize() }, () => [null]);
}

export function defaultWrapPicks(): WrapPick[][] {
  return Array.from({ length: attackArraySize() }, () => [null]);
}

/**
 * Sums card pip damage and the marginal effects of Tough Hide and each of the
 * attacker's damage buffs across all active rows (same scope as
 * {@link damageIfAllHitsWrap}).
 */
export function damageModifierBreakdownWrap(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): DamageModifierBreakdown {
  let rawCardDamage = 0;
  let toughHideReduction = 0;
  let totalEffective = 0;
  const buffBonuses = activeAttacker.damageBuffs.map((buff) => ({
    id: buff.id,
    label: buff.label,
    bonus: 0,
  }));

  for (let i = 0; i < wrapPicks.length; i++) {
    if (!attackRowIsActive(wrapPicks, i, damageMods, activeBaseCount)) continue;
    for (const id of wrapPicks[i]) {
      if (id == null) continue;
      const card = getPlaybookResult(id).damage;
      if (card <= 0) continue;
      rawCardDamage += card;
      const full = effectiveDamageForChoice(id, damageMods);
      totalEffective += full;
      toughHideReduction +=
        effectiveDamageForChoice(id, { ...damageMods, toughHide: false }) -
        full;
      for (const bb of buffBonuses) {
        const without: PlaybookDamageMods = {
          ...damageMods,
          buffs: { ...damageMods.buffs, [bb.id]: false },
        };
        bb.bonus += full - effectiveDamageForChoice(id, without);
      }
    }
  }

  return {
    rawCardDamage,
    toughHideReduction,
    buffBonuses,
    totalEffective,
  };
}

/** Damage per attack if every pick on that attack hits (playbook modifiers applied). */
export function damageIfAllHitsWrap(
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] {
  return wrapPicks.map((picks, i) =>
    attackRowIsActive(wrapPicks, i, damageMods, activeBaseCount)
      ? picks.reduce(
          (s, id) =>
            s + (id == null ? 0 : effectiveDamageForChoice(id, damageMods)),
          0,
        )
      : 0,
  );
}
