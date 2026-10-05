/** Per-swing TAC after charge, cover, Bonus Time and everything earlier swings carried over. */

import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { isChargeSwing } from '@/core/attacks/attackStructure';
import {
  carriedEffectsBeforeAttack,
  coverTacPenaltyForAttack,
} from '@/core/attacks/earlierSwingEffects';
import {
  effectiveDefMinRoll,
  enemyDefForSwing,
  tacBonusFromDefReductionCap,
} from '@/core/attacks/swingDefense';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import {
  BONUS_TIME_TAC_BONUS,
  CHARGE_TAC_BONUS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** The swing and every already computed TAC modifier that `sumSwingTac` adds up. */
export type SwingTacTerms = {
  attacker: AttackerData;
  attackIndex: number;
  chargeAttackIndex: number;
  activeBaseCount: number;
  carriedTacBonus: number;
  coverTacPenalty: number;
  bonusTimeTacBonus: number;
  initialTacModifier: number;
};

/** A swing's base TAC plus the charge bonus and every already computed modifier. */
export const sumSwingTac = (terms: SwingTacTerms): number => {
  const {
    attacker,
    attackIndex,
    chargeAttackIndex,
    activeBaseCount,
    carriedTacBonus,
    coverTacPenalty,
    bonusTimeTacBonus,
    initialTacModifier,
  } = terms;

  const charge = isChargeSwing(attackIndex, chargeAttackIndex, activeBaseCount)
    ? CHARGE_TAC_BONUS
    : 0;

  return (
    attacker.tac +
    charge +
    carriedTacBonus -
    coverTacPenalty +
    bonusTimeTacBonus +
    initialTacModifier
  );
};

/** What one swing rolls: its dice and the DEF each die must meet. */
export type SwingTacAndDef = {
  tac: number;
  defMinRoll: number;
};

/** TAC and to-hit DEF for one row: carry-over, DEF-floor dice, cover and Bonus Time combined. */
export const swingTacAndDef = (
  plan: AttackPlan,
  attackIndex: number,
  params: ActivationRollParams,
): SwingTacAndDef => {
  const { wrapPicks, characterPlayPicks } = plan;

  const {
    attacker,
    chargeAttackIndex,
    enemyHasCover,
    enemyDefensiveStance,
    damageMods,
    enemyDef,
    bonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
  } = params;

  const { tacBonus, defReduction } = carriedEffectsBeforeAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    damageMods,
    activeBaseCount,
  );

  const defForRow = enemyDefForSwing(
    enemyDef,
    attackIndex,
    chargeAttackIndex,
    enemyDefensiveStance,
    activeBaseCount,
  );

  const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
  const defMinRoll = effectiveDefMinRoll(defForRow, defReduction);

  const coverPenalty = coverTacPenaltyForAttack(
    attacker,
    enemyHasCover,
    wrapPicks,
    attackIndex,
    activeBaseCount,
  );

  const bonusTimeTac =
    bonusTimeByAttack[attackIndex] === true ? BONUS_TIME_TAC_BONUS : 0;

  const tac = sumSwingTac({
    attacker,
    attackIndex,
    chargeAttackIndex,
    activeBaseCount,
    carriedTacBonus: tacBonus + tacFromDefCap,
    coverTacPenalty: coverPenalty,
    bonusTimeTacBonus: bonusTimeTac,
    initialTacModifier,
  });

  return { tac, defMinRoll };
};
