/** One pass over the activation: what each swing inherits from the swings before it. */

import type {
  ActivationTimeline,
  CarriedEffects,
  SwingState,
  TimelineParams,
} from '@/core/attacks/activationTimeline.types';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import { isChargeSwing } from '@/core/attacks/attackStructure';
import {
  effectivePlayForPick,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import {
  activeBuffs,
  attackerTraits,
  chargeTraitDamage,
  effectiveDamageForChoice,
  effectivePlaybookDamage,
  withSwingDamageBonus,
} from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlay,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
} from '@/core/playbook/playbookIndex';
import {
  pickEffectName,
  pickEffectsForLaterSwings,
} from '@/core/playbook/rowEffects';

const NO_CARRIED_EFFECTS: CarriedEffects = {
  tacBonus: 0,
  defReduction: 0,
  armorReduction: 0,
  damageBonus: 0,
};

const EMPTY_SWING_STATE: SwingState = {
  effectsBefore: NO_CARRIED_EFFECTS,
  damagingPlayBySlot: [],
  playDamageBySlot: [],
  healthPlayDivisorBySlot: [],
  targetBurningBefore: false,
  playbookDamageBonus: 0,
  chargeTraitDamage: 0,
  chargeDamage: 0,
};

/** A row's state, or an empty one for a row past the end of the plan. */
export const swingStateAt = (
  timeline: ActivationTimeline,
  attackIndex: number,
): SwingState => {
  return timeline[attackIndex] ?? EMPTY_SWING_STATE;
};

/**
 * The mods one swing's playbook damage results are resolved with: the
 * activation's, plus that swing's +DMG (Burning Passion, Assist).
 */
export const swingDamageMods = (
  damageMods: PlaybookDamageMods,
  timeline: ActivationTimeline,
  attackIndex: number,
): PlaybookDamageMods => {
  const state = swingStateAt(timeline, attackIndex);

  return withSwingDamageBonus(damageMods, state.playbookDamageBonus);
};

const hasAnyEffect = (effects: CarriedEffects): boolean => {
  return (
    effects.tacBonus !== 0 ||
    effects.defReduction !== 0 ||
    effects.armorReduction !== 0 ||
    effects.damageBonus !== 0
  );
};

/**
 * Named effects present before any swing: the toggled guild buffs and debuffs,
 * and the attacker's traits that hold during each of its attacks.
 */
const preAppliedEffects = (
  params: TimelineParams,
): Map<string, CarriedEffects> => {
  const named = new Map<string, CarriedEffects>();

  for (const buff of activeBuffs(params.attacker, params.damageMods)) {
    const effects: CarriedEffects = {
      ...NO_CARRIED_EFFECTS,
      tacBonus: buff.tacBonus ?? 0,
      armorReduction: buff.armorReduction ?? 0,
    };

    if (hasAnyEffect(effects)) {
      named.set(buff.id, effects);
    }
  }

  for (const trait of attackerTraits(params.attacker, params.damageMods)) {
    const effects: CarriedEffects = {
      ...NO_CARRIED_EFFECTS,
      armorReduction: trait.armorReduction ?? 0,
    };

    if (hasAnyEffect(effects)) {
      named.set(trait.id, effects);
    }
  }

  return named;
};

/** The total of every named effect, each counted once. */
const sumEffects = (
  named: ReadonlyMap<string, CarriedEffects>,
): CarriedEffects => {
  let tacBonus = 0;
  let defReduction = 0;
  let armorReduction = 0;
  let damageBonus = 0;

  for (const effects of named.values()) {
    tacBonus += effects.tacBonus;
    defReduction += effects.defReduction;
    armorReduction += effects.armorReduction;
    damageBonus += effects.damageBonus;
  }

  return { tacBonus, defReduction, armorReduction, damageBonus };
};

/** +DMG Burning Passion-like traits add to playbook damage against a Burning target. */
const damageBonusVsBurning = (params: TimelineParams): number => {
  const traits = attackerTraits(params.attacker, params.damageMods);

  return traits.reduce((sum, trait) => {
    return sum + (trait.playbookDamageVsBurning ?? 0);
  }, 0);
};

/**
 * Whether a swing causes damage when every pick lands: a card result above 0
 * after its modifiers, or a damaging play. Damage reduced to 0 is no damage.
 */
const swingCausesDamage = (
  params: TimelineParams,
  row: readonly WrapPick[],
  state: SwingState,
): boolean => {
  const { attacker, damageMods } = params;
  const swingMods = withSwingDamageBonus(damageMods, state.playbookDamageBonus);

  const causesCardDamage = row.some((id) => {
    return id != null && effectiveDamageForChoice(attacker, id, swingMods) > 0;
  });

  return (
    causesCardDamage || swingPlayDamage(state) > 0 || state.chargeDamage > 0
  );
};

type SwingChargeDamage = Pick<SwingState, 'chargeTraitDamage' | 'chargeDamage'>;

/**
 * Sweeping Charge-like damage on the charge swing. It triggers when the charge
 * picks a playbook damage result, even one Tough Hide zeroes; it is unmodified.
 */
const swingChargeDamageFor = (
  plan: AttackPlan,
  params: TimelineParams,
  attackIndex: number,
): SwingChargeDamage => {
  const { attacker, damageMods, chargeAttackIndex, activeBaseCount } = params;

  const charge = isChargeSwing(attackIndex, chargeAttackIndex, activeBaseCount);

  if (!charge) {
    return { chargeTraitDamage: 0, chargeDamage: 0 };
  }

  const traitDamage = chargeTraitDamage(attacker, damageMods);
  const row = plan.wrapPicks[attackIndex] ?? [];

  const picksDamageResult = row.some((id) => {
    return id != null && getPlaybookResult(attacker, id).damage > 0;
  });

  return {
    chargeTraitDamage: traitDamage,
    chargeDamage: picksDamageResult ? traitDamage : 0,
  };
};

/** Total play damage a swing deals when every pick on it lands. */
export const swingPlayDamage = (state: SwingState): number => {
  return state.playDamageBySlot.reduce((sum, damage) => sum + damage, 0);
};

/** Condition damage of a play that deals the target's current HP over `divisor`. */
const currentHealthDamage = (hpLeft: number, divisor: number): number => {
  const remaining = Math.max(0, hpLeft);

  return Math.floor(remaining / divisor);
};

/**
 * A swing's play damage by slot when the target has `hpLeft` HP before it:
 * plays scaled by current HP are recomputed, the rest keep their damage.
 */
export const playDamageForHealth = (
  state: SwingState,
  hpLeft: number,
): number[] => {
  return state.playDamageBySlot.map((damage, slot) => {
    const divisor = state.healthPlayDivisorBySlot[slot] ?? 0;

    if (divisor <= 0) {
      return damage;
    }

    return currentHealthDamage(hpLeft, divisor);
  });
};

/** Whether any of a swing's plays deals damage scaled by the target's current HP. */
export const swingHasHealthPlay = (state: SwingState): boolean => {
  return state.healthPlayDivisorBySlot.some((divisor) => divisor > 0);
};

/** Damage a swing deals when every pick on it lands: card results, plays and charge. */
const swingDamageIfAllHit = (
  params: TimelineParams,
  row: readonly WrapPick[],
  state: SwingState,
): number => {
  const { attacker, damageMods } = params;
  const swingMods = withSwingDamageBonus(damageMods, state.playbookDamageBonus);

  const cardDamage = row.reduce((sum, id) => {
    if (id == null) {
      return sum;
    }

    return sum + effectiveDamageForChoice(attacker, id, swingMods);
  }, 0);

  return cardDamage + swingPlayDamage(state) + state.chargeDamage;
};

type SwingPlayDamage = Pick<
  SwingState,
  'damagingPlayBySlot' | 'playDamageBySlot' | 'healthPlayDivisorBySlot'
>;

/**
 * The damaging plays one swing's picks trigger. A Once Per Turn play deals its
 * damage only on the first pick that triggers it; `usedOncePerTurn` carries
 * those across the walk. `hpLeft` is the target's HP before this swing, for
 * plays scaled by current HP.
 */
const swingPlayDamageFor = (
  plan: AttackPlan,
  params: TimelineParams,
  attackIndex: number,
  usedOncePerTurn: Set<string>,
  hpLeft: number,
): SwingPlayDamage => {
  const { attacker, damageMods } = params;
  const row = plan.wrapPicks[attackIndex] ?? [];

  const damagingPlayBySlot: (CharacterPlay | null)[] = row.map(() => null);
  const playDamageBySlot: number[] = row.map(() => 0);
  const healthPlayDivisorBySlot: number[] = row.map(() => 0);

  row.forEach((id, pickIndex) => {
    if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
      return;
    }

    const playId = effectivePlayForPick(
      attacker,
      plan.characterPlayPicks,
      attackIndex,
      pickIndex,
    );

    const play = getCharacterPlay(attacker, playId);
    const printedDamage = play?.damage ?? 0;
    const divisor = play?.currentHealthDivisor ?? 0;
    const dealsDamage = printedDamage > 0 || divisor > 0;

    if (play == null || !dealsDamage) {
      return;
    }

    const spent = play.oncePerTurn && usedOncePerTurn.has(play.id);

    if (spent) {
      return;
    }

    if (play.oncePerTurn) {
      usedOncePerTurn.add(play.id);
    }

    damagingPlayBySlot[pickIndex] = play;

    if (divisor > 0) {
      healthPlayDivisorBySlot[pickIndex] = divisor;
      playDamageBySlot[pickIndex] = currentHealthDamage(hpLeft, divisor);

      return;
    }

    playDamageBySlot[pickIndex] = effectivePlaybookDamage(
      attacker,
      printedDamage,
      damageMods,
    );
  });

  return { damagingPlayBySlot, playDamageBySlot, healthPlayDivisorBySlot };
};

export const activationTimeline = (
  plan: AttackPlan,
  params: TimelineParams,
): ActivationTimeline => {
  const { wrapPicks, characterPlayPicks } = plan;
  const { attacker, damageMods, activeBaseCount } = params;

  // Effects of the same name never stack, so each name keeps its first value.
  const named = preAppliedEffects(params);
  const passionBonus = damageBonusVsBurning(params);
  const onDamageTraits = attackerTraits(attacker, damageMods).filter(
    (trait) => {
      return trait.onDamage != null;
    },
  );

  // Burning before the first swing comes from the toggled Burning condition.
  let burning = damageMods.targetBurning;

  const preAppliedState: SwingState = {
    ...EMPTY_SWING_STATE,
    effectsBefore: sumEffects(named),
    targetBurningBefore: burning,
    playbookDamageBonus: burning ? passionBonus : 0,
  };

  const usedOncePerTurn = new Set<string>();

  // All-hit damage dealt so far, for plays scaled by the target's current HP.
  let damageDealt = 0;

  const states: SwingState[] = wrapPicks.map(() => preAppliedState);

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  for (const attackIndex of order) {
    const effectsBefore = sumEffects(named);
    const burningBonus = burning ? passionBonus : 0;

    const state: SwingState = {
      effectsBefore,
      ...swingPlayDamageFor(
        plan,
        params,
        attackIndex,
        usedOncePerTurn,
        params.targetHp - damageDealt,
      ),
      targetBurningBefore: burning,
      playbookDamageBonus: burningBonus + effectsBefore.damageBonus,
      ...swingChargeDamageFor(plan, params, attackIndex),
    };

    states[attackIndex] = state;

    const row = wrapPicks[attackIndex] ?? [];

    damageDealt += swingDamageIfAllHit(params, row, state);

    for (let pickIndex = 0; pickIndex < row.length; pickIndex++) {
      const pickEffects = pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
        damageMods,
        activeBaseCount,
        params.enemyKnockedDown,
      );

      const effects: CarriedEffects = {
        tacBonus: pickEffects.tacBonusForLater,
        defReduction: pickEffects.defReductionForLater,
        armorReduction: pickEffects.armorReduction,
        damageBonus: pickEffects.damageBonusForLater,
      };

      const name = pickEffectName(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
      );

      const alreadyApplied = named.has(name);

      if (hasAnyEffect(effects) && !alreadyApplied) {
        named.set(name, effects);
      }
    }

    // On-damage traits (Searing Strike) only help the swings after this one.
    if (!swingCausesDamage(params, row, state)) {
      continue;
    }

    for (const trait of onDamageTraits) {
      const armorReduction = trait.onDamage?.armorReduction ?? 0;
      const effects: CarriedEffects = { ...NO_CARRIED_EFFECTS, armorReduction };

      if (hasAnyEffect(effects) && !named.has(trait.id)) {
        named.set(trait.id, effects);
      }

      if (trait.onDamage?.burning === true) {
        burning = true;
      }
    }
  }

  return states;
};
