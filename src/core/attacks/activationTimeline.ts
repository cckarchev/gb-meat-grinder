/** One pass over the activation: what each swing inherits from the swings before it. */

import type {
  ActivationTimeline,
  CarriedEffects,
  SwingState,
  TimelineParams,
} from '@/core/attacks/activationTimeline.types';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import {
  effectivePlayForPick,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import { activeBuffs, effectivePlaybookDamage } from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
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
  const preAppliedState: SwingState = {
    ...EMPTY_SWING_STATE,
    effectsBefore: sumEffects(named),
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
    states[attackIndex] = {
      effectsBefore: sumEffects(named),
      ...swingPlayDamageFor(plan, params, attackIndex, usedOncePerTurn),
    };

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
  }

  return states;
};
