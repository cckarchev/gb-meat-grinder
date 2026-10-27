/** Roll context and hit odds for every swing in the activation. */

import {
  hitProbabilityPerDie,
  probAttackSucceeds,
} from "../damage/probability";
import type { AttackPlan } from "../plan/attackPlan.types";
import { wrapNetThresholdAllHits } from "../playbook/wrapSlots";
import { activationTimeline, swingStateAt } from "./activationTimeline";
import type { ActivationTimeline } from "./activationTimeline.types";
import { activationAttackIndices } from "./attackRows";
import type {
  ActivationRollParams,
  AttackRollContext,
} from "./attackSequence.types";
import { armorAfterAttackRow, armorForAttackRow } from "./swingDefense";
import { swingTacAndDef } from "./swingTac";

/**
 * Every swing's roll context, with the activation timeline they were computed
 * from so callers reuse it instead of rebuilding it.
 */
export const computeAttackSequence = (
  plan: AttackPlan,
  params: ActivationRollParams,
): { attacks: AttackRollContext[]; timeline: ActivationTimeline } => {
  const { wrapPicks } = plan;
  const { attacker, armor } = params;

  const attacks: AttackRollContext[] = [];

  const order = activationAttackIndices(params, wrapPicks);

  const timeline = activationTimeline(plan, params);

  for (const attackIndex of order) {
    const { tac, defMinRoll, defMinRollAfter } = swingTacAndDef(
      plan,
      attackIndex,
      params,
      timeline,
    );

    const state = swingStateAt(timeline, attackIndex);
    const rowArmor = armorForAttackRow(armor, state);
    const armorAfter = armorAfterAttackRow(armor, state);
    const { netHitBonus } = state;

    const pHit = hitProbabilityPerDie(defMinRoll);
    const netSuccessesNeeded = wrapNetThresholdAllHits(
      attacker,
      wrapPicks[attackIndex],
    );

    const prob = probAttackSucceeds(
      tac,
      pHit,
      rowArmor,
      netSuccessesNeeded,
      netHitBonus,
    );

    attacks.push({
      attackIndex,
      tac,
      armor: rowArmor,
      defMinRoll,
      defMinRollAfter,
      armorAfter,
      pHit,
      netSuccessesNeeded,
      netHitBonus,
      prob,
    });
  }

  return { attacks, timeline };
};
