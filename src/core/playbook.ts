/**
 * Playbook + wrap / character-play helpers. Everything model-specific (the
 * playbook columns, damage buffs, traits) comes from the `attacker` argument;
 * the engine reads effect flags on results, never their id strings.
 */

import { berserkerRowOffset } from '@/core/attackStructure';
import { DEF_MAX } from '@/core/constants';
import { maxPlaybookNet, playbookIndex } from '@/core/playbookIndex';
import type { AttackerData } from '@/types/core/attacker';
import type { GuildBuff } from '@/types/core/guild';
import type {
  CharacterPlay,
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

/** Character plays this attacker's GB / 1GB results can trigger (from the catalog). */
export function characterPlaysForAttacker(
  attacker: AttackerData,
): readonly CharacterPlay[] {
  return attacker.characterPlays ?? [];
}

export function getCharacterPlay(
  attacker: AttackerData,
  id: CharacterPlayPick | null,
): CharacterPlay | undefined {
  if (id == null) return undefined;
  return characterPlaysForAttacker(attacker).find((c) => c.id === id);
}

/** Play picked by default when a GB result is chosen: the first guild play. */
export function defaultCharacterPlayId(
  attacker: AttackerData,
): CharacterPlayPick | null {
  return characterPlaysForAttacker(attacker)[0]?.id ?? null;
}

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

/** Guild buffs this model can receive (excludes buffs it is the source of). */
export function availableBuffs(attacker: AttackerData) {
  const excluded = attacker.excludedGuildBuffs ?? [];
  return attacker.guild.buffs.filter((b) => !excluded.includes(b.id));
}

/**
 * Guild effects that buff the attacker, for the attacker panel (all of them,
 * including excluded ones — the panel renders those disabled).
 */
export function guildAttackerBuffs(
  attacker: AttackerData,
): readonly GuildBuff[] {
  return attacker.guild.buffs.filter(
    (b) => (b.target ?? 'attacker') === 'attacker',
  );
}

/**
 * Guild effects that debuff the target (e.g. −ARM), for the enemy panel (all of
 * them, including excluded ones — the panel renders those disabled).
 */
export function guildEnemyDebuffs(
  attacker: AttackerData,
): readonly GuildBuff[] {
  return attacker.guild.buffs.filter((b) => b.target === 'enemy');
}

/** The attacker's available buffs that are currently toggled on. */
export function activeBuffs(attacker: AttackerData, mods: PlaybookDamageMods) {
  return availableBuffs(attacker).filter((b) => mods.buffs[b.id]);
}

/**
 * Flat, unmodified damage from the model's toggled special abilities (e.g.
 * Thresher's Don't Fear The Reaper). Independent of attack rolls and ARM /
 * Tough Hide / buffs, so it is simply added to the activation's damage.
 */
export function specialAbilityFlatDamage(
  attacker: AttackerData,
  toggled: Record<string, boolean>,
  charging: boolean,
): number {
  return (attacker.specialAbilities ?? [])
    .filter(
      (a) =>
        (a.alwaysActive === true || toggled[a.id] === true) &&
        (a.requiresCharge !== true || charging),
    )
    .reduce((sum, a) => sum + a.flatDamage, 0);
}

/**
 * Activation-order index of the swing that also lands guaranteed flat damage tied
 * to the charge (e.g. Sweeping Charge), or -1 when there is none. That damage is
 * dealt alongside the charge attack, so it does not buff that attack — but it
 * counts as damage for "after damage" triggers (Searing Strike, Burning) on every
 * later swing.
 */
export function chargeFlatDamageSwingIndex(
  attacker: AttackerData,
  toggled: Record<string, boolean>,
  charging: boolean,
  chargeAttackIndex: number,
): number {
  if (!charging || chargeAttackIndex < 0) return -1;
  return specialAbilityFlatDamage(attacker, toggled, charging) > 0
    ? chargeAttackIndex
    : -1;
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

/** Sum of +TAC from selected buffs (e.g. Tempered Steel), added to every attack. */
export function buffsTacBonusSum(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number {
  return activeBuffs(attacker, mods).reduce((s, b) => s + (b.tacBonus ?? 0), 0);
}

/** True if the attacker has Searing Strike, intrinsically or via an active buff. */
export function attackerHasSearingStrike(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean {
  if (attacker.searingStrike === true) return true;
  return activeBuffs(attacker, mods).some(
    (b) => b.grantsSearingStrike === true,
  );
}

/** True if the target starts the activation Burning (a selected enemy debuff). */
export function enemyBurning(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean {
  return activeBuffs(attacker, mods).some((b) => b.appliesBurning === true);
}

/**
 * True if the target already carries the Searing Strike condition from a
 * pre-applied enemy debuff (e.g. a teammate applied it earlier). Whole-activation
 * — present from the first swing, unlike the attacker's own Searing Strike which
 * only lands after its first damaging hit. Same source, so the two never stack.
 */
export function enemyHasStaticSearingStrike(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean {
  return activeBuffs(attacker, mods).some(
    (b) => b.appliesSearingStrike === true,
  );
}

/** Copy of `mods` with `extra` folded into its per-line `extraDamageBonus`. */
export function withExtraDamageBonus(
  mods: PlaybookDamageMods,
  extra: number,
): PlaybookDamageMods {
  if (extra === 0) return mods;
  return { ...mods, extraDamageBonus: (mods.extraDamageBonus ?? 0) + extra };
}

/**
 * Enemy DEF after pre-attack conditions. Knocked Down and Snared each give the
 * attacker −1 DEF. The result is intentionally NOT floored at {@link DEF_MIN}:
 * the to-hit roll floors at 2+ elsewhere (see `effectiveDefMinRoll`), and any
 * reduction past that floor is surfaced here so the engine can convert the
 * surplus into bonus attack dice (see `tacBonusFromDefReductionCap`).
 */
export function effectiveEnemyDef(
  enemyDef: number,
  knockedDown: boolean,
  snared: boolean,
): number {
  const reduction = (knockedDown ? 1 : 0) + (snared ? 1 : 0);
  return Math.min(DEF_MAX, enemyDef - reduction);
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
  return Math.max(
    0,
    cardDamage -
      pen +
      playbookDamageBonusSum(attacker, mods) +
      (mods.extraDamageBonus ?? 0),
  );
}

export function effectiveDamageForChoice(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): number {
  return effectivePlaybookDamage(
    attacker,
    getPlaybookResult(attacker, id).damage,
    mods,
  );
}

export function momentousLineStyle(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle {
  const r = getPlaybookResult(attacker, id);
  if (r.momentum !== true) return 'none';
  // A momentous line with no card damage (e.g. a GB) is a pure momentum result —
  // always rendered momentous. 'zeroed' is reserved for a momentous *damage* line
  // whose damage was reduced to 0 (e.g. Tough Hide), to flag that it deals nothing.
  if (r.damage <= 0) return 'heat';
  return effectiveDamageForChoice(attacker, id, mods) > 0 ? 'heat' : 'zeroed';
}

/**
 * True when this pick earns momentum on a hit. Momentum is a property of the
 * playbook result (its `momentum` flag) — it does not depend on damage, so a
 * 0-damage momentous line (e.g. a GB) or one whose damage Tough Hide zeroes still
 * generates momentum. (Damage only drives the chip styling; see momentousLineStyle.)
 */
export function pickGeneratesMomentum(
  attacker: AttackerData,
  id: WrapPick | null | undefined,
): boolean {
  if (id == null) return false;
  return getPlaybookResult(attacker, id).momentum === true;
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
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(attacker, id)) total += 1;
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
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return startingMomentum;
  let total = startingMomentum;
  for (let oi = 0; oi <= pos; oi++) {
    const j = order[oi];
    const row = wrapPicks[j];
    if (row?.length) {
      for (const id of row) {
        if (pickGeneratesMomentum(attacker, id)) total += 1;
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
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
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
 * −ARM on this swing from effects on the target before it:
 *  • a GB character play that reduces ARM (e.g. They Ain't Tough!) applied on an
 *    earlier swing — its own source, so it never stacks past 1; plus
 *  • Searing Strike — a separate −1 (stacks on top) when the target has the
 *    condition before this swing: either pre-applied (a static enemy debuff,
 *    present from swing 0) or self-applied by the attacker's own Searing Strike
 *    after this model dealt it any damage on a strictly earlier swing — card
 *    damage, a flat-damage character play (Impale), or Sweeping Charge's flat
 *    damage on the charge swing (`chargeFlatDamageIndex`). Same source, so it
 *    adds at most 1.
 */
export function armorReductionBeforeAttack(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
  chargeFlatDamageIndex: number,
): number {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return 0;
  let gbReduction = 0;
  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];
    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) continue;
      gbReduction += rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
        activeBaseCount,
      ).armorReduction;
    }
  }
  let reduction = Math.min(1, gbReduction);
  const searingStrike =
    enemyHasStaticSearingStrike(attacker, damageMods) ||
    (attackerHasSearingStrike(attacker, damageMods) &&
      targetDamagedBeforeAttack(
        attacker,
        wrapPicks,
        characterPlayPicks,
        damageMods,
        attackIndex,
        activeBaseCount,
        chargeFlatDamageIndex,
      ));
  if (searingStrike) {
    reduction += 1;
  }
  return reduction;
}

/**
 * True if this model has already dealt the target any damage on a swing strictly
 * earlier than `attackIndex`, so "after damage" effects (Searing Strike's −1 ARM
 * + Burning) apply from this swing onward. Damage counts from any source on that
 * earlier swing: its card damage, a flat-damage character play (e.g. Impale), or
 * — on the charge swing (`chargeFlatDamageIndex`, or -1) — Sweeping Charge's flat
 * damage, which lands alongside the charge attack. The damage is simultaneous
 * with its own swing, so that swing is still resolved at full ARM; only later
 * swings benefit (a charge's first attack is therefore always at full ARM).
 */
export function targetDamagedBeforeAttack(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
  chargeFlatDamageIndex: number,
): boolean {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const pos = order.indexOf(attackIndex);
  if (pos < 0) return false;
  const flatBySlot = characterPlayFlatBySlot(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
  );
  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];
    if (j === chargeFlatDamageIndex) return true;
    if (baseAttackDealtDamage(attacker, wrapPicks[j] ?? [], damageMods)) {
      return true;
    }
    if ((flatBySlot[j] ?? []).some((n) => n > 0)) return true;
  }
  return false;
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
  const dodge = r.dodge ? '<' : '';
  if (r.picksCharacterPlay && r.damage > 0) {
    return `${effectiveDamageForChoice(attacker, id, mods)}GB${dodge}`;
  }
  if (r.damage > 0 && r.label === String(r.damage)) {
    return `${effectiveDamageForChoice(attacker, id, mods)}${dodge}`;
  }
  return r.label + dodge;
}

/**
 * {@link playbookLineDisplayLabel} split into stackable rows so a multi-effect
 * line can render one effect per line in the playbook circle (e.g. `3GB` →
 * `3` / `GB`, `KD<` → `KD` / `<`). Single-effect lines return one segment.
 */
export function playbookLineDisplaySegments(
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string[] {
  const label = playbookLineDisplayLabel(attacker, id, mods);
  return label.match(/\d+|<|[A-Za-z]+/g) ?? [label];
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
    (id) =>
      id != null && effectiveDamageForChoice(attacker, id, damageMods) > 0,
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
    if (
      attackRowIsActive(attacker, wrapPicks, ber, damageMods, activeBaseCount)
    ) {
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

export function characterPlayPickModifiers(
  attacker: AttackerData,
  pick: CharacterPlayPick,
): {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReduction: number;
} {
  const cp = getCharacterPlay(attacker, pick);
  return {
    tacBonusForLater: cp?.tacBonusForLater ?? 0,
    defReductionForLater: cp?.defReductionForLater ?? 0,
    armorReduction: cp?.armorReduction ?? 0,
  };
}

/**
 * Damage from each pick's GB-triggered character play (e.g. Impale), indexed by
 * [attackIndex][slot]. A play that deals damage is treated like a playbook line:
 * Tough Hide reduces it and a +DMG buff (Tooled Up) lifts it. Burning Passion is
 * playbook-only (injected per swing, never here), so it does not apply; and a
 * special ability's flat damage (Sweeping Charge) is handled separately and stays
 * fully unmodified. Non-zero only where a flat-damage play is *live*: a
 * Once-Per-Turn play counts on its first pick in activation order; a later
 * re-pick of the same play contributes nothing.
 */
export function characterPlayFlatBySlot(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[][] {
  const out = wrapPicks.map((row) => row.map(() => 0));
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  // Character-play damage is modified like a playbook line — Tough Hide reduces
  // it, Tooled Up lifts it — but never sees Burning Passion (that bonus is
  // injected per swing onto card damage only, not into `damageMods`). A 0-damage
  // play such as Shield Glare yields 0.
  const dealtBy = (cp: CharacterPlay): number =>
    effectivePlaybookDamage(attacker, cp.flatDamage ?? 0, damageMods);
  const used = new Set<string>();
  for (const i of order) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      const id = wrapPicks[i][k];
      if (id == null || !choiceUsesCharacterPlay(attacker, id)) continue;
      const f = characterPlayPicks[i]?.[k] ?? defaultCharacterPlayId(attacker);
      if (f == null) continue;
      const cp = getCharacterPlay(attacker, f);
      if (cp == null) continue;
      if (!cp.oncePerTurn) {
        out[i][k] = dealtBy(cp);
      } else if (!used.has(f)) {
        out[i][k] = dealtBy(cp);
        used.add(f);
      }
    }
  }
  return out;
}

/** Live flat-damage character plays aggregated by play, for damage breakdowns. */
export function characterPlayFlatSources(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { label: string; amount: number }[] {
  const flatBySlot = characterPlayFlatBySlot(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
  );
  const byPlay = new Map<string, { label: string; amount: number }>();
  for (let i = 0; i < wrapPicks.length; i++) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      if (flatBySlot[i][k] <= 0) continue;
      const f = characterPlayPicks[i]?.[k] ?? defaultCharacterPlayId(attacker);
      const cp = f == null ? undefined : getCharacterPlay(attacker, f);
      if (cp == null) continue;
      const entry = byPlay.get(cp.id) ?? { label: cp.label, amount: 0 };
      entry.amount += flatBySlot[i][k];
      byPlay.set(cp.id, entry);
    }
  }
  return [...byPlay.values()];
}

/** True when this play changes the attack math (so a no-op like Snack Break is false). */
export function characterPlayHasEffect(cp: CharacterPlay): boolean {
  return Boolean(
    cp.tacBonusForLater ||
      cp.defReductionForLater ||
      cp.armorReduction ||
      cp.flatDamage,
  );
}

/** Human-readable effect + cadence, used for the selector tooltip / aria-label. */
export function characterPlayEffectSummary(cp: CharacterPlay): string {
  const effects: string[] = [];
  if (cp.tacBonusForLater) {
    effects.push(`+${cp.tacBonusForLater} TAC on later attacks`);
  }
  if (cp.defReductionForLater) {
    effects.push(`−${cp.defReductionForLater} enemy DEF on later attacks`);
  }
  if (cp.armorReduction) {
    effects.push(`−${cp.armorReduction} enemy ARM on later attacks`);
  }
  if (cp.flatDamage) {
    effects.push(`${cp.flatDamage} unmodified damage`);
  }
  const effect = effects.length
    ? `${effects.join('; ')}.`
    : 'No effect on the attack math.';
  const cadence = cp.oncePerTurn ? 'Once per turn.' : '';
  return `${effect} ${cadence}`;
}

/**
 * Character plays already taken on picks strictly before `(attackIndex,
 * pickIndex)` in activation order (base then its berserker, then next base, …).
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
  const used = new Set<string>();
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return used;

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;
    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];
      if (id == null || !choiceUsesCharacterPlay(attacker, id)) continue;
      const f = characterPlayPicks[j]?.[k] ?? defaultCharacterPlayId(attacker);
      // Repeatable plays may be taken again and stack, so they never count as
      // "used up" — they stay available and keep applying on later swings.
      if (f != null && getCharacterPlay(attacker, f)?.oncePerTurn !== false) {
        used.add(f);
      }
    }
  }
  return used;
}

/**
 * True if Knock Down is unavailable for this pick: either the target is already
 * Knocked Down before the activation, or KD was taken on a strictly earlier wrap
 * pick (activation order). Only one KD can ever apply.
 */
export function kdAlreadyTakenBeforePick(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  enemyKnockedDown = false,
): boolean {
  if (enemyKnockedDown) return true;
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
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
): {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReduction: number;
} {
  const none = {
    tacBonusForLater: 0,
    defReductionForLater: 0,
    armorReduction: 0,
  };
  const id = wrapPicks[attackIndex][pickIndex];
  if (id == null) return none;
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
    return none;
  }
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater ?? 0,
      defReductionForLater: result.defReductionForLater ?? 0,
      armorReduction: 0,
    };
  }
  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );
  const f =
    characterPlayPicks[attackIndex]?.[pickIndex] ??
    defaultCharacterPlayId(attacker);
  if (f == null || used.has(f)) return none;
  return characterPlayPickModifiers(attacker, f);
}

/** Character plays still choosable on this pick (those not used by earlier picks). */
export function characterPlayAvailabilityForPick(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { available: readonly CharacterPlay[]; depleted: boolean } {
  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );
  const available = characterPlaysForAttacker(attacker).filter(
    (cp) => !used.has(cp.id),
  );
  return { available, depleted: available.length === 0 };
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
      const used = characterPlayUsageBeforePick(
        attacker,
        wrapPicks,
        next,
        i,
        k,
        damageMods,
        activeBaseCount,
      );
      const available = characterPlaysForAttacker(attacker).filter(
        (cp) => !used.has(cp.id),
      );
      if (available.length === 0) continue;
      const f = next[i][k];
      if (f == null || !available.some((cp) => cp.id === f)) {
        next[i][k] = available[0].id;
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
  const col = attacker.playbook.find((c) => c.results.some((r) => r.id === id));
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
 * Per-swing Burning Passion bonus, indexed by attack row: +1 to each damaging
 * line on swings where the target was Burning *before* the swing — Burning was
 * pre-applied (an enemy debuff) or Searing Strike lit it once this model dealt
 * any damage on an earlier swing. That damage can be card damage, a flat-damage
 * character play (Impale), or Sweeping Charge's flat damage on the charge swing
 * (`chargeFlatDamageIndex`, or -1) — all attributed to their own swing, so the
 * swing that first deals damage is not itself Burning. All-zero unless the
 * attacker has Burning Passion.
 */
export function burningPassionBonusByAttack(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  chargeFlatDamageIndex: number,
): number[] {
  const out = wrapPicks.map(() => 0);
  if (attacker.burningPassion !== true) return out;
  const staticBurn = enemyBurning(attacker, damageMods);
  const hasSearingStrike = attackerHasSearingStrike(attacker, damageMods);
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const flatBySlot = characterPlayFlatBySlot(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
  );
  let dealtDamageBefore = false;
  for (const i of order) {
    const burningBefore = staticBurn || (hasSearingStrike && dealtDamageBefore);
    out[i] = burningBefore ? 1 : 0;
    if (
      i === chargeFlatDamageIndex ||
      baseAttackDealtDamage(attacker, wrapPicks[i] ?? [], damageMods) ||
      (flatBySlot[i] ?? []).some((n) => n > 0)
    ) {
      dealtDamageBefore = true;
    }
  }
  return out;
}

/**
 * Sums card pip damage and the marginal effects of Tough Hide, each of the
 * attacker's damage buffs, and Burning Passion across all active rows (same
 * scope as {@link damageIfAllHitsWrap}).
 */
export function damageModifierBreakdownWrap(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  chargeFlatDamageIndex: number,
): DamageModifierBreakdown {
  let rawCardDamage = 0;
  let toughHideReduction = 0;
  let totalEffective = 0;
  let burningPassionBonus = 0;
  const buffBonuses = availableBuffs(attacker).map((buff) => ({
    id: buff.id,
    label: buff.label,
    bonus: 0,
  }));
  const bonusByAttack = burningPassionBonusByAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
    chargeFlatDamageIndex,
  );

  for (let i = 0; i < wrapPicks.length; i++) {
    if (
      !attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)
    ) {
      continue;
    }
    const rowMods = withExtraDamageBonus(damageMods, bonusByAttack[i]);
    for (const id of wrapPicks[i]) {
      if (id == null) continue;
      const card = getPlaybookResult(attacker, id).damage;
      if (card <= 0) continue;
      rawCardDamage += card;
      const full = effectiveDamageForChoice(attacker, id, rowMods);
      totalEffective += full;
      toughHideReduction +=
        effectiveDamageForChoice(attacker, id, {
          ...rowMods,
          toughHide: false,
        }) - full;
      for (const bb of buffBonuses) {
        const without: PlaybookDamageMods = {
          ...rowMods,
          buffs: { ...rowMods.buffs, [bb.id]: false },
        };
        bb.bonus += full - effectiveDamageForChoice(attacker, id, without);
      }
      burningPassionBonus +=
        full -
        effectiveDamageForChoice(attacker, id, {
          ...rowMods,
          extraDamageBonus: 0,
        });
    }
  }

  if (burningPassionBonus > 0) {
    buffBonuses.push({
      id: 'burningPassion',
      label: 'Burning Passion',
      bonus: burningPassionBonus,
    });
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
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  chargeFlatDamageIndex: number,
): number[] {
  const bonusByAttack = burningPassionBonusByAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
    chargeFlatDamageIndex,
  );
  const flatBySlot = characterPlayFlatBySlot(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
  );
  return wrapPicks.map((picks, i) => {
    if (
      !attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)
    ) {
      return 0;
    }
    const rowMods = withExtraDamageBonus(damageMods, bonusByAttack[i]);
    return picks.reduce(
      (s, id, k) =>
        s +
        (id == null ? 0 : effectiveDamageForChoice(attacker, id, rowMods)) +
        (flatBySlot[i]?.[k] ?? 0),
      0,
    );
  });
}
