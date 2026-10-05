/**
 * Keeps at most one Knock Down in a plan: only the first in activation order counts.
 */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import { maxPlaybookColumnForPlan } from '@/core/attacks/maxPlaybookColumn';
import { initialCharacterPlayFor } from '@/core/characterPlays/characterPlayLookup';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/core/plan/attackPlan.types';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { cheapestChoiceId } from '@/core/playbook/playbookIndex';
import { getPlaybookResult, wrapSlotBudget } from '@/core/playbook/wrapSlots';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Cheapest playbook line at or under `budget` that does not apply Knock Down. */
const firstPickInBudgetExcludingKd = (
  attacker: AttackerData,
  budget: number,
): PlaybookChoiceId => {
  if (budget < MIN_PLAYBOOK_NET) {
    return cheapestChoiceId(attacker);
  }

  const columnsByCost = [...attacker.playbook].sort(
    (a, b) => a.netSuccesses - b.netSuccesses,
  );

  for (const column of columnsByCost) {
    if (column.netSuccesses > budget) {
      continue;
    }

    for (const result of column.results) {
      if (result.appliesKnockDown) {
        continue;
      }

      return result.id;
    }
  }

  return cheapestChoiceId(attacker);
};

/**
 * Replace every KD pick after the first in activation order with the cheapest
 * non-KD line in its slot budget. Mutates `draft`; returns whether anything changed.
 */
export const stripDuplicateKnockDown = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
): boolean => {
  const { attacker } = params;
  let changed = false;
  // A target that is already Knocked Down counts as the one allowed KD, so every
  // playbook KD pick is redundant and gets replaced.
  let kdSeen = params.enemyKnockedDown;

  const activationOrder = activationAttackIndices(
    attacker,
    draft.wrapPicks,
    params.damageMods,
    params.activeBaseCount,
  );

  for (const attackIndex of activationOrder) {
    const maxNet = maxPlaybookColumnForPlan(draft, attackIndex, params);
    const picks = draft.wrapPicks[attackIndex];

    for (let slot = 0; slot < picks.length; slot++) {
      const id = picks[slot];

      if (id == null || !getPlaybookResult(attacker, id).appliesKnockDown) {
        continue;
      }

      if (!kdSeen) {
        kdSeen = true;
        continue;
      }

      const slotBudget = wrapSlotBudget(attacker, maxNet, slot);
      const replacement = firstPickInBudgetExcludingKd(attacker, slotBudget);

      picks[slot] = replacement;
      draft.characterPlayPicks[attackIndex][slot] = initialCharacterPlayFor(
        attacker,
        replacement,
      );

      changed = true;
    }
  }

  return changed;
};
