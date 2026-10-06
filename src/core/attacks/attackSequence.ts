/** Roll context and hit odds for every swing in the activation. */

import {
  activationTimeline,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { ActivationTimeline } from '@/core/attacks/activationTimeline.types';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import type {
  ActivationRollParams,
  AttackRollContext,
} from '@/core/attacks/attackSequence.types';
import {
  armorAfterAttackRow,
  armorForAttackRow,
} from '@/core/attacks/swingDefense';
import { swingTacAndDef } from '@/core/attacks/swingTac';
import {
  hitProbabilityPerDie,
  probAttackSucceeds,
} from '@/core/damage/probability';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { wrapNetThresholdAllHits } from '@/core/playbook/wrapSlots';

/**
 * Every swing's roll context, with the activation timeline they were computed
 * from so callers reuse it instead of rebuilding it.
 */
export const computeAttackSequence = (
  plan: AttackPlan,
  params: ActivationRollParams,
): { attacks: AttackRollContext[]; timeline: ActivationTimeline } => {
  const { wrapPicks } = plan;
  const { attacker, armor, damageMods, activeBaseCount } = params;

  const attacks: AttackRollContext[] = [];

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

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
