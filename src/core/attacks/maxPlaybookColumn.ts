/** Highest playbook column a swing can reach, from its TAC and the enemy ARM. */

import {
  activationTimeline,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { armorForAttackRow } from '@/core/attacks/swingDefense';
import { swingTacAndDef } from '@/core/attacks/swingTac';
import { maxNetSuccessesForRoll } from '@/core/damage/probability';
import type { AttackPlan } from '@/core/plan/attackPlan.types';

/** Highest net successes reachable in one roll on this row (TAC - ARM cap). */
export const maxPlaybookColumnForRow = (
  plan: AttackPlan,
  attackIndex: number,
  params: ActivationRollParams,
): number => {
  const timeline = activationTimeline(plan, params);

  const { tac } = swingTacAndDef(plan, attackIndex, params, timeline);

  const rowArmor = armorForAttackRow(
    params.armor,
    swingStateAt(timeline, attackIndex),
  );

  return maxNetSuccessesForRoll(tac, rowArmor);
};
