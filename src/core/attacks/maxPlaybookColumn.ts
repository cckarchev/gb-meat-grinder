/** Highest playbook column a swing can reach, from its TAC, the enemy ARM and any gained net hits. */

import {
  activationTimeline,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { armorForAttackRow } from '@/core/attacks/swingDefense';
import { swingTacAndDef } from '@/core/attacks/swingTac';
import { maxNetSuccessesForRoll } from '@/core/damage/probability';
import type { AttackPlan } from '@/core/plan/attackPlan.types';

/**
 * Highest net successes reachable in one roll on this row (TAC - ARM cap).
 * Builds its own timeline on purpose: the clamp calls it row by row while it
 * edits the plan, and an edit can change what later rows see (cover, DEF,
 * Searing Strike), so a timeline built before the loop would be stale.
 */
export const maxPlaybookColumnForRow = (
  plan: AttackPlan,
  attackIndex: number,
  params: ActivationRollParams,
): number => {
  const timeline = activationTimeline(plan, params);

  const { tac } = swingTacAndDef(plan, attackIndex, params, timeline);

  const state = swingStateAt(timeline, attackIndex);
  const rowArmor = armorForAttackRow(params.armor, state);

  return maxNetSuccessesForRoll(tac, rowArmor, state.netHitBonus);
};
