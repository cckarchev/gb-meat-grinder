/**
 * Playbook + wrap / character-play helpers. Everything model-specific (the
 * playbook columns, damage buffs, traits) comes from the `attacker` argument;
 * the engine reads effect flags on results, never their id strings.
 */

import { berserkerRowOffset } from '@/core/attackStructure';
import { maxPlaybookNet, playbookIndex } from '@/core/playbookIndex';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  CharacterPlayUsage,
  DamageModifierBreakdown,
  MomentousLineStyle,
  PlaybookChoiceId,
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/types/core/playbook';

export function getPlaybookResult(
  attacker: AttackerData,
  id: PlaybookChoiceId,
): PlaybookResult {
  const r = playbookIndex(attacker).byId.get(id);
  if (!r) throw new Error(`Unknown playbook id: ${id}`);
  return r;
}

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  buffs: {},
};

/** The attacker's buffs that are currently toggled on. */
export function activeBuffs(attacker: AttackerData, mods: PlaybookDamageMods) {
  return attacker.buffs.filter((b) => mods.buffs[b.id]);
}

/** Sum of the +damage from selected buffs. */
export function playbookDamageBonusSum(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number {
  let sum = 0;
  for (const buff of activeBuffs(attacker, mods)) sum += buff.damageBonus ?? 0;
  return sum;
}

/** True if a selected buff turns playbook damage into Tough-Hide-ignoring Condition Damage. */
export function buffsIgnoreToughHide(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean {
  return activeBuffs(attacker, mods).some((b) => b.ignoresToughHide === true);
}

/** Enemy ARM after the selected buffs' reductions (floored at 0). */
export function effectiveArmor(
  attacker: AttackerData,
  baseArmor: number,
  mods: PlaybookDamageMods,
): number {
  const reduction = activeBuffs(attacker, mods).reduce(
    (s, b) => s + (b.armorReduction ?? 0),
    0,
  );
  return Math.max(0, baseArmor - reduction);
}

export function effectivePlaybookDamage(
  attacker: AttackerData,
  cardDamage: number,
  mods: PlaybookDamageMods,
): number {
  if (cardDamage <= 0) {
    return 0;
  }
  const pen = mods.toughHide && !buffsIgnoreToughHide(attacker, mods) ? 1 : 0;
  return Math.max(0, cardDamage - pen + playbookDamageBonusSum(attacker, mods));
}

export function effectiveDamageForChoice(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): number {
  return effectivePlaybookDamage(attacker, getPlaybookResult(attacker, id).damage, mods);
}

export function momentousLineStyle(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle {
  const r = getPlaybookResult(attacker, id);
  if (r.momentum !== true) return 'none';
  return effectiveDamageForChoice(attacker, id, mods) > 0 ? 'heat' : 'zeroed';
}

/**
 * True when this pick earns momentum on a hit: momentous on the card **and**
 * effective damage greater than 0 (same rule as the red playbook chip; Tough Hide can zero it out).
 */
export function pickGeneratesMomentum(
  attacker: AttackerData,
  id: WrapPick | null | undefined,
  mods: PlaybookDamageMods,
): boolean {
  if (id == null) return false;
  return momentousLineStyle(attacker, id, mods) === 'heat';
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number {
  const order = activationAttackIndices(attacker, wrapPicks, damageMods, activeBaseCount);
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(attacker, id, damageMods)) total += 1;
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number {
  const order = activationAttackIndices(attacker, wrapPicks, damageMods, activeBaseCount);
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi <= pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(attacker, id, damageMods)) total += 1;
      }
    }
    if (bonusTimeSpent(j, bonusTimeByAttack)) total -= 1;
  }
  return total;
}

/** Clears Bonus Time flags that can no longer be paid (pool less than 1 before that swing). */
export function sanitizeBonusTimeFlags(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): boolean[] {
  const order = activationAttackIndices(attacker, wrapPicks, damageMods, activeBaseCount);
  const next = bonusTimeByAttack.map((b) => b);
  for (let iter = 0; iter < order.length + 2; iter++) {
    let changed = false;
    for (const i of order) {
      if (!next[i]) continue;
      const pool = momentumPoolBeforeBonusTime(
        attacker,
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

/** True if this pick removes the enemy's cover (a push / double push result). */
export function wrapPickClearsCover(
  attacker: AttackerData,
  id: WrapPick | null | undefined,
): boolean {
  if (id == null) return false;
  return getPlaybookResult(attacker, id).clearsCover === true;
}

/**
 * Fixed GB swing order for cover: each base then its berserker, regardless of
 * whether the berserker row is “active” for damage (so > / >> are never skipped).
 */
export function coverSwingClockIndices(
  attacker: AttackerData,
  activeBaseCount: number,
): number[] {
  const out: number[] = [];
  const offset = berserkerRowOffset(attacker);
  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);
    if (attacker.berserker) out.push(offset + b);
  }
  return out;
}

/**
 * Playbook button text: plain numeric pips (label matches damage) show the
 * **effective** value; a character-play line whose label ends in “GB” shows the
 * effective damage prefix (e.g. **0GB**, **1GB**) when it also deals damage.
 */
export function playbookLineDisplayLabel(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string {
  const r = getPlaybookResult(attacker, id);
  if (r.picksCharacterPlay && r.damage > 0) {
    return `${effectiveDamageForChoice(attacker, id, mods)}GB`;
  }
  if (r.damage > 0 && r.label === String(r.damage)) {
    return String(effectiveDamageForChoice(attacker, id, mods));
  }
  return r.label;
}

/** Selected playbook lines on one attack row, for summaries (e.g. `> → 2 → GB`). */
export function formatWrapRowSelectionLabel(
  attacker: AttackerData,
  picks: readonly WrapPick[],
  damageMods: PlaybookDamageMods,
): string {
  const labels: string[] = [];
  for (const id of picks) {
    if (id == null) continue;
    labels.push(playbookLineDisplayLabel(attacker, id, damageMods));
  }
  return labels.length > 0 ? labels.join(' → ') : '-';
}

/** Rows below the berserker offset are base attacks; at/above it are berserkers. */
export function attackRowIsBerserker(
  attacker: AttackerData,
  attackIndex: number,
): boolean {
  return attackIndex >= berserkerRowOffset(attacker);
}

export function berserkerSourceBaseIndex(
  attacker: AttackerData,
  attackIndex: number,
): number {
  return attackIndex - berserkerRowOffset(attacker);
}

/** True if this base attack includes any non-null wrap line with modified playbook damage > 0. */
export function baseAttackDealtDamage(
  attacker: AttackerData,
  picks: WrapPick[],
  damageMods: PlaybookDamageMods,
): boolean {
  return picks.some(
    (id) => id != null && effectiveDamageForChoice(attacker, id, damageMods) > 0,
  );
}

/**
 * Base rows are active while their index is within the allocated base count;
 * berserker rows are active only for Berserker models when their source base is
 * active and dealt damage.
 */
export function attackRowIsActive(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): boolean {
  const offset = berserkerRowOffset(attacker);
  if (attackIndex < offset) {
    return attackIndex < activeBaseCount;
  }
  if (!attacker.berserker) return false;
  const b = berserkerSourceBaseIndex(attacker, attackIndex);
  if (b < 0 || b >= activeBaseCount) return false;
  return baseAttackDealtDamage(attacker, wrapPicks[b] ?? [], damageMods);
}

/**
 * Swing order: each active base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked; they always resolve immediately after the base that earned them.
 */
export function activationAttackIndices(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] {
  const out: number[] = [];
  const offset = berserkerRowOffset(attacker);
  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);
    if (!attacker.berserker) continue;
    const ber = offset + b;
    if (attackRowIsActive(attacker, wrapPicks, ber, damageMods, activeBaseCount)) {
      out.push(ber);
    }
  }
  return out;
}

export function choiceUsesCharacterPlay(
  attacker: AttackerData,
  id: WrapPick,
): id is PlaybookChoiceId {
  if (id == null) return false;
  return getPlaybookResult(attacker, id).picksCharacterPlay === true;
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): CharacterPlayUsage {
  let so = false;
  let stagger = false;
  const order = activationAttackIndices(attacker, wrapPicks, damageMods, activeBaseCount);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return { so, stagger };

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];
      if (id == null || !choiceUsesCharacterPlay(attacker, id)) continue;
      const f = characterPlayPicks[j]?.[k] ?? 'so';
      if (f === 'so') so = true;
      else stagger = true;
    }
  }
  return { so, stagger };
}

/** True if Knock Down was already taken on a strictly earlier wrap pick (activation order). */
export function kdAlreadyTakenBeforePick(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): boolean {
  const order = activationAttackIndices(attacker, wrapPicks, damageMods, activeBaseCount);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return false;

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];
      if (id != null && getPlaybookResult(attacker, id).appliesKnockDown) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Modifiers this pick adds to later swings (SO/Stagger each once; after both,
 * further GB / 1GB lines have no character-play effect).
 */
export function rowEffectsForPick(
  attacker: AttackerData,
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
  const result = getPlaybookResult(attacker, id);
  if (
    result.appliesKnockDown &&
    kdAlreadyTakenBeforePick(
      attacker,
      wrapPicks,
      attackIndex,
      pickIndex,
      damageMods,
      activeBaseCount,
    )
  ) {
    return { tacBonusForLater: 0, defReductionForLater: 0 };
  }
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater,
      defReductionForLater: result.defReductionForLater,
    };
  }
  const u = characterPlayUsageBeforePick(
    attacker,
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { canPickSo: boolean; canPickStagger: boolean; depleted: boolean } {
  const u = characterPlayUsageBeforePick(
    attacker,
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
  attacker: AttackerData,
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
        !choiceUsesCharacterPlay(attacker, wrapPicks[i][k])
      ) {
        if (next[i]?.[k] != null) {
          next[i][k] = null;
          changed = true;
        }
        continue;
      }
      const u = characterPlayUsageBeforePick(
        attacker,
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

export function netSuccessesForChoice(
  attacker: AttackerData,
  id: PlaybookChoiceId,
): number {
  const col = attacker.playbook.find((c) =>
    c.results.some((r) => r.id === id),
  );
  if (!col) throw new Error(`No column for id ${id}`);
  return col.netSuccesses;
}

/** How many playbook results this attack can resolve (ceil(maxNet / card cap)). */
export function wrapSlotCount(attacker: AttackerData, maxNet: number): number {
  if (maxNet < 1) return 1;
  return Math.ceil(maxNet / maxPlaybookNet(attacker));
}

/**
 * Max net for slot `slotIndex` (0-based): each full card-width step consumes
 * the widest column; leftover is the cap for the next result, not based on
 * what you picked in the previous slot.
 */
export function wrapSlotBudget(
  attacker: AttackerData,
  maxNet: number,
  slotIndex: number,
): number {
  const raw = maxNet - slotIndex * maxPlaybookNet(attacker);
  if (raw < 1) return 0;
  return Math.min(maxPlaybookNet(attacker), raw);
}

/**
 * Total net successes needed on the roll for this slot’s column, treating later
 * wrap slots as continuing past the card’s widest column (8th, 9th, …).
 */
export function wrapExtendedNetNeeded(
  attacker: AttackerData,
  slotIndex: number,
  columnNet: number,
): number {
  return slotIndex * maxPlaybookNet(attacker) + columnNet;
}

/**
 * Net successes the pool must reach so every non-null wrap pick resolves,
 * using the same extended indexing as the playbook UI. Not a naive sum of
 * column costs: later wrap slots count past the card width.
 */
export function wrapNetThresholdAllHits(
  attacker: AttackerData,
  picks: readonly WrapPick[],
): number {
  let maxNeed = 0;
  for (let k = 0; k < picks.length; k++) {
    const id = picks[k];
    if (id == null) continue;
    const need = wrapExtendedNetNeeded(
      attacker,
      k,
      netSuccessesForChoice(attacker, id),
    );
    if (need > maxNeed) maxNeed = need;
  }
  return maxNeed;
}

export function defaultCharacterPlayPicksWrap(
  size: number,
): CharacterPlayPickSlot[][] {
  return Array.from({ length: size }, () => [null]);
}

export function defaultWrapPicks(size: number): WrapPick[][] {
  return Array.from({ length: size }, () => [null]);
}

/**
 * Sums card pip damage and the marginal effects of Tough Hide and each of the
 * attacker's damage buffs across all active rows (same scope as
 * {@link damageIfAllHitsWrap}).
 */
export function damageModifierBreakdownWrap(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): DamageModifierBreakdown {
  let rawCardDamage = 0;
  let toughHideReduction = 0;
  let totalEffective = 0;
  const buffBonuses = attacker.buffs.map((buff) => ({
    id: buff.id,
    label: buff.label,
    bonus: 0,
  }));

  for (let i = 0; i < wrapPicks.length; i++) {
    if (!attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)) {
      continue;
    }
    for (const id of wrapPicks[i]) {
      if (id == null) continue;
      const card = getPlaybookResult(attacker, id).damage;
      if (card <= 0) continue;
      rawCardDamage += card;
      const full = effectiveDamageForChoice(attacker, id, damageMods);
      totalEffective += full;
      toughHideReduction +=
        effectiveDamageForChoice(attacker, id, { ...damageMods, toughHide: false }) -
        full;
      for (const bb of buffBonuses) {
        const without: PlaybookDamageMods = {
          ...damageMods,
          buffs: { ...damageMods.buffs, [bb.id]: false },
        };
        bb.bonus += full - effectiveDamageForChoice(attacker, id, without);
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] {
  return wrapPicks.map((picks, i) =>
    attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)
      ? picks.reduce(
          (s, id) =>
            s +
            (id == null ? 0 : effectiveDamageForChoice(attacker, id, damageMods)),
          0,
        )
      : 0,
  );
}
