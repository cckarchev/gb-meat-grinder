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
import type { CharacterPlay, WrapPick } from '@/core/playbook/playbook.types';
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
};

const EMPTY_SWING_STATE: SwingState = {
  effectsBefore: NO_CARRIED_EFFECTS,
  damagingPlayBySlot: [],
  playDamageBySlot: [],
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

const hasAnyEffect = (effects: CarriedEffects): boolean => {
  return (
    effects.tacBonus !== 0 ||
    effects.defReduction !== 0 ||
    effects.armorReduction !== 0
  );
};

/** Named effects present before any swing: the toggled guild buffs and debuffs. */
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

  return named;
};

/** The total of every named effect, each counted once. */
const sumEffects = (
  named: ReadonlyMap<string, CarriedEffects>,
): CarriedEffects => {
  let tacBonus = 0;
  let defReduction = 0;
  let armorReduction = 0;

  for (const effects of named.values()) {
    tacBonus += effects.tacBonus;
    defReduction += effects.defReduction;
    armorReduction += effects.armorReduction;
  }

  return { tacBonus, defReduction, armorReduction };
};

/** Whether the target is Burning before the first swing (a pre-applied debuff). */
const startsBurning = (params: TimelineParams): boolean => {
  const buffs = activeBuffs(params.attacker, params.damageMods);

  return buffs.some((buff) => buff.appliesBurning === true);
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

  const cardDamage = row.some((id) => {
    return id != null && effectiveDamageForChoice(attacker, id, swingMods) > 0;
  });

  return cardDamage || swingPlayDamage(state) > 0 || state.chargeDamage > 0;
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

type SwingPlayDamage = Pick<
  SwingState,
  'damagingPlayBySlot' | 'playDamageBySlot'
>;

/**
 * The damaging plays one swing's picks trigger. A Once Per Turn play deals its
 * damage only on the first pick that triggers it; `usedOncePerTurn` carries
 * those across the walk.
 */
const swingPlayDamageFor = (
  plan: AttackPlan,
  params: TimelineParams,
  attackIndex: number,
  usedOncePerTurn: Set<string>,
): SwingPlayDamage => {
  const { attacker, damageMods } = params;
  const row = plan.wrapPicks[attackIndex] ?? [];

  const damagingPlayBySlot: (CharacterPlay | null)[] = row.map(() => null);
  const playDamageBySlot: number[] = row.map(() => 0);

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

    if (play == null || printedDamage <= 0) {
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
    playDamageBySlot[pickIndex] = effectivePlaybookDamage(
      attacker,
      printedDamage,
      damageMods,
    );
  });

  return { damagingPlayBySlot, playDamageBySlot };
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

  let burning = startsBurning(params);

  const preAppliedState: SwingState = {
    ...EMPTY_SWING_STATE,
    effectsBefore: sumEffects(named),
    targetBurningBefore: burning,
    playbookDamageBonus: burning ? passionBonus : 0,
  };

  const usedOncePerTurn = new Set<string>();

  const states: SwingState[] = wrapPicks.map(() => preAppliedState);

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  for (const attackIndex of order) {
    const state: SwingState = {
      effectsBefore: sumEffects(named),
      ...swingPlayDamageFor(plan, params, attackIndex, usedOncePerTurn),
      targetBurningBefore: burning,
      playbookDamageBonus: burning ? passionBonus : 0,
      ...swingChargeDamageFor(plan, params, attackIndex),
    };

    states[attackIndex] = state;

    const row = wrapPicks[attackIndex] ?? [];

    for (let pickIndex = 0; pickIndex < row.length; pickIndex++) {
      const pickEffects = pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
        damageMods,
        activeBaseCount,
      );

      const effects: CarriedEffects = {
        tacBonus: pickEffects.tacBonusForLater,
        defReduction: pickEffects.defReductionForLater,
        armorReduction: pickEffects.armorReduction,
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
