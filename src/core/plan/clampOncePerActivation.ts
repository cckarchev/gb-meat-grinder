/**
 * Keeps at most one Knock Down and one Tackle in a plan: only the first of each
 * in activation order counts. A later line with other effects stays, since
 * those still apply.
 */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import { maxPlaybookColumnForRow } from '@/core/attacks/maxPlaybookColumn';
import { initialCharacterPlayFor } from '@/core/characterPlays/characterPlayLookup';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/core/plan/attackPlan.types';
import { knockDownIsOnlyEffect } from '@/core/playbook/knockDown';
import {
  appliesKnockDown,
  isOncePerActivation,
  type PlaybookResultMatcher,
  stealsBall,
} from '@/core/playbook/oncePerActivation';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import {
  cheapestChoiceId,
  getPlaybookResult,
} from '@/core/playbook/playbookIndex';
import { wrapSlotBudget } from '@/core/playbook/wrapSlots';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** One effect that only the first matching pick of the activation applies. */
type OncePerActivationRule = {
  applies: PlaybookResultMatcher;
  /** A repeated line is only replaced when this effect is all it does. */
  isOnlyEffect: PlaybookResultMatcher;
  /** The effect is already in place before the activation starts. */
  appliedBeforeActivation: boolean;
};

/**
 * Cheapest playbook line at or under `budget` that is neither a KD nor a
 * Tackle, so a replacement never trips the other rule.
 */
const cheapestRepeatableChoice = (
  attacker: AttackerData,
  budget: number,
): PlaybookChoiceId => {
  if (budget < MIN_PLAYBOOK_NET) {
    return cheapestChoiceId(attacker);
  }

  // Columns are stored cheapest first (checked in attackerData.test.ts).
  for (const column of attacker.playbook) {
    if (column.netSuccesses > budget) {
      continue;
    }

    for (const result of column.results) {
      if (isOncePerActivation(result)) {
        continue;
      }

      return result.id;
    }
  }

  return cheapestChoiceId(attacker);
};

/**
 * Replace every pick that only repeats `rule`'s effect after its first use in
 * activation order with the cheapest repeatable line in its slot budget.
 * Mutates `draft`; returns whether anything changed.
 */
const stripRepeatedEffect = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
  rule: OncePerActivationRule,
): boolean => {
  const { attacker } = params;
  let changed = false;
  let effectSeen = rule.appliedBeforeActivation;

  const activationOrder = activationAttackIndices(params, draft.wrapPicks);

  for (const attackIndex of activationOrder) {
    const maxNet = maxPlaybookColumnForRow(draft, attackIndex, params);
    const picks = draft.wrapPicks[attackIndex];

    for (let slot = 0; slot < picks.length; slot++) {
      const id = picks[slot];

      if (id == null) {
        continue;
      }

      const result = getPlaybookResult(attacker, id);

      if (!rule.applies(result)) {
        continue;
      }

      if (!effectSeen) {
        effectSeen = true;
        continue;
      }

      if (!rule.isOnlyEffect(result)) {
        continue;
      }

      const slotBudget = wrapSlotBudget(attacker, maxNet, slot);
      const replacement = cheapestRepeatableChoice(attacker, slotBudget);

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

/**
 * Replace every KD-only pick after the first KD in activation order. A target
 * that is already Knocked Down counts as the one allowed KD, so every playbook
 * KD pick is redundant.
 */
export const stripDuplicateKnockDown = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
): boolean => {
  return stripRepeatedEffect(draft, params, {
    applies: appliesKnockDown,
    isOnlyEffect: knockDownIsOnlyEffect,
    appliedBeforeActivation: params.enemyKnockedDown,
  });
};

/**
 * Replace every Tackle after the first one in activation order: the ball is
 * already taken. Tackle lines carry no other effect, so all of them go.
 */
export const stripDuplicateTackle = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
): boolean => {
  return stripRepeatedEffect(draft, params, {
    applies: stealsBall,
    isOnlyEffect: stealsBall,
    appliedBeforeActivation: false,
  });
};
