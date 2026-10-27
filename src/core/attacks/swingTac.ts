/**
 * Per-swing TAC after charge, cover, Bonus Time and everything earlier swings
 * carried over.
 */

import type { AttackerData } from "@/data/attackers/attacker.types";
import type { AttackPlan } from "../plan/attackPlan.types";
import { BONUS_TIME_TAC_BONUS, CHARGE_TAC_BONUS } from "../shared/constants";
import { swingStateAt } from "./activationTimeline";
import type { ActivationTimeline } from "./activationTimeline.types";
import type { ActivationRollParams } from "./attackSequence.types";
import { isChargeSwing } from "./attackStructure";
import { coverTacPenaltyForAttack } from "./earlierSwingEffects";
import {
  effectiveDefMinRoll,
  enemyDefForSwing,
  tacBonusFromDefReductionCap,
} from "./swingDefense";

/**
 * The swing and every already computed TAC modifier that `sumSwingTac` adds up.
 */
type SwingTacTerms = {
  attacker: AttackerData;
  attackIndex: number;
  chargeAttackIndex: number;
  activeBaseCount: number;
  carriedTacBonus: number;
  coverTacPenalty: number;
  bonusTimeTacBonus: number;
  initialTacModifier: number;
};

/**
 * A swing's base TAC plus the charge bonus and every already computed modifier.
 */
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
type SwingTacAndDef = {
  tac: number;
  defMinRoll: number;
  /** DEF once this swing lands, with the reductions it applies. */
  defMinRollAfter: number;
};

/**
 * TAC and to-hit DEF for one row: carry-over, DEF-floor dice, cover and Bonus
 * Time combined.
 */
export const swingTacAndDef = (
  plan: AttackPlan,
  attackIndex: number,
  params: ActivationRollParams,
  timeline: ActivationTimeline,
): SwingTacAndDef => {
  const { wrapPicks } = plan;

  const {
    attacker,
    chargeAttackIndex,
    enemyHasCover,
    enemyDefensiveStance,
    enemyDef,
    bonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
  } = params;

  const state = swingStateAt(timeline, attackIndex);
  const { tacBonus, defReduction } = state.effectsBefore;

  const defForRow = enemyDefForSwing(
    enemyDef,
    attackIndex,
    chargeAttackIndex,
    enemyDefensiveStance,
    activeBaseCount,
  );

  const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
  const defMinRoll = effectiveDefMinRoll(defForRow, defReduction);
  const defMinRollAfter = effectiveDefMinRoll(
    defForRow,
    state.effectsAfter.defReduction,
  );

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

  return { tac, defMinRoll, defMinRollAfter };
};
