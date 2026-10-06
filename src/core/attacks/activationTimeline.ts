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
  swingPlayDamage,
  swingPlayDamageFor,
} from '@/core/attacks/swingPlayDamage';
import {
  activeBuffs,
  attackerTraits,
  chargeTraitDamage,
  effectiveDamageForChoice,
  withSwingDamageBonus,
} from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import {
  pickEffectName,
  pickEffectsForLaterSwings,
} from '@/core/playbook/rowEffects';
import { sumOf } from '@/core/shared/sumOf';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_CARRIED_EFFECTS: CarriedEffects = {
  tacBonus: 0,
  defReduction: 0,
  armorReduction: 0,
  damageBonus: 0,
};

const EMPTY_SWING_STATE: SwingState = {
  effectsBefore: NO_CARRIED_EFFECTS,
  effectsAfter: NO_CARRIED_EFFECTS,
  damagingPlayBySlot: [],
  playDamageBySlot: [],
  healthPlayDivisorBySlot: [],
  targetBurningBefore: false,
  playbookDamageBonus: 0,
  netHitBonus: 0,
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
export const swingStateDamageMods = (
  damageMods: PlaybookDamageMods,
  state: SwingState,
): PlaybookDamageMods => {
  return withSwingDamageBonus(damageMods, state.playbookDamageBonus);
};

/** {@link swingStateDamageMods} for the swing at `attackIndex` in `timeline`. */
export const swingDamageMods = (
  damageMods: PlaybookDamageMods,
  timeline: ActivationTimeline,
  attackIndex: number,
): PlaybookDamageMods => {
  const state = swingStateAt(timeline, attackIndex);

  return swingStateDamageMods(damageMods, state);
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
 * Records `effects` under `name` unless it is empty or that name already
 * applies: effects of the same name never stack.
 */
const addNamedEffect = (
  named: Map<string, CarriedEffects>,
  name: string,
  effects: CarriedEffects,
): void => {
  if (!hasAnyEffect(effects) || named.has(name)) {
    return;
  }

  named.set(name, effects);
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
      defReduction: buff.defReduction ?? 0,
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

/**
 * Net hits the active buffs add to the activation's first attack (Instruction).
 * Each buff is one named effect, so the largest one applies, not their sum.
 */
const firstAttackNetHitBonus = (params: TimelineParams): number => {
  const bonuses = activeBuffs(params.attacker, params.damageMods).map(
    (buff) => {
      return buff.firstAttackNetHitBonus ?? 0;
    },
  );

  return Math.max(0, ...bonuses);
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

  return sumOf(traits, (trait) => trait.playbookDamageVsBurning);
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

/** Damage a swing deals when every pick on it lands: card results, plays and charge. */
export const swingDamageIfAllHit = (
  attacker: AttackerData,
  damageMods: PlaybookDamageMods,
  row: readonly WrapPick[],
  state: SwingState,
): number => {
  const swingMods = swingStateDamageMods(damageMods, state);

  const cardDamage = row.reduce((sum, id) => {
    if (id == null) {
      return sum;
    }

    return sum + effectiveDamageForChoice(attacker, id, swingMods);
  }, 0);

  return cardDamage + swingPlayDamage(state) + state.chargeDamage;
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
    effectsAfter: sumEffects(named),
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

  const firstAttackIndex = order[0];
  const instructedNetHits = firstAttackNetHitBonus(params);

  for (const attackIndex of order) {
    const effectsBefore = sumEffects(named);
    const isFirstAttack = attackIndex === firstAttackIndex;
    const netHitBonus = isFirstAttack ? instructedNetHits : 0;
    const burningBonus = burning ? passionBonus : 0;

    const state: SwingState = {
      effectsBefore,
      // Replaced below once this swing's own effects are in.
      effectsAfter: effectsBefore,
      ...swingPlayDamageFor(
        plan,
        params,
        attackIndex,
        usedOncePerTurn,
        params.targetHp - damageDealt,
      ),
      targetBurningBefore: burning,
      playbookDamageBonus: burningBonus + effectsBefore.damageBonus,
      netHitBonus,
      ...swingChargeDamageFor(plan, params, attackIndex),
    };

    states[attackIndex] = state;

    const row = wrapPicks[attackIndex] ?? [];

    const swingDamage = swingDamageIfAllHit(attacker, damageMods, row, state);

    damageDealt += swingDamage;

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
        armorReduction: pickEffects.armorReductionForLater,
        damageBonus: pickEffects.damageBonusForLater,
      };

      const name = pickEffectName(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
      );

      addNamedEffect(named, name, effects);
    }

    // On-damage traits (Searing Strike) only help the swings after this one.
    // Every damage term is at least 0, so any damage at all means it hit.
    const causesDamage = swingDamage > 0;
    const triggeredTraits = causesDamage ? onDamageTraits : [];

    for (const trait of triggeredTraits) {
      const armorReduction = trait.onDamage?.armorReduction ?? 0;
      const effects: CarriedEffects = { ...NO_CARRIED_EFFECTS, armorReduction };

      addNamedEffect(named, trait.id, effects);

      if (trait.onDamage?.burning === true) {
        burning = true;
      }
    }

    states[attackIndex] = { ...state, effectsAfter: sumEffects(named) };
  }

  return states;
};
