/**
 * One clamp pass over a single attack row of a plan.
 */

import { attackRowIsActive } from '@/core/attacks/attackRows';
import { maxPlaybookColumnForRow } from '@/core/attacks/maxPlaybookColumn';
import type {
  AttackPlan,
  AttackPlanClampParams,
  AttackPlanRow,
} from '@/core/plan/attackPlan.types';
import { clampRowPicks } from '@/core/plan/clampRowPicks';
import { rowEqual } from '@/core/shared/gridEqual';

/** Pad or trim the row's play slots to one per pick. Mutates `draft`. */
const alignPlaySlots = (draft: AttackPlan, attackIndex: number): boolean => {
  const picks = draft.wrapPicks[attackIndex];
  const plays = draft.characterPlayPicks[attackIndex];
  let changed = false;

  while (plays.length > picks.length) {
    plays.pop();
    changed = true;
  }

  while (plays.length < picks.length) {
    plays.push(null);
    changed = true;
  }

  return changed;
};

/**
 * Align the row's play slots, empty it when the row is inactive, and otherwise
 * clamp its picks to what the row can reach. Mutates `draft`; returns whether
 * anything changed.
 */
export const clampAttackRow = (
  draft: AttackPlan,
  attackIndex: number,
  params: AttackPlanClampParams,
): boolean => {
  let changed = alignPlaySlots(draft, attackIndex);

  const active = attackRowIsActive(params, draft.wrapPicks, attackIndex);

  if (!active) {
    const alreadyEmpty =
      draft.wrapPicks[attackIndex].length === 0 &&
      draft.characterPlayPicks[attackIndex].length === 0;

    if (alreadyEmpty) {
      return changed;
    }

    draft.wrapPicks[attackIndex] = [];
    draft.characterPlayPicks[attackIndex] = [];

    return true;
  }

  if (draft.wrapPicks[attackIndex].length === 0) {
    draft.wrapPicks[attackIndex] = [null];
    draft.characterPlayPicks[attackIndex] = [null];
    changed = true;
  }

  const current: AttackPlanRow = {
    picks: draft.wrapPicks[attackIndex],
    plays: draft.characterPlayPicks[attackIndex],
  };

  const maxNet = maxPlaybookColumnForRow(draft, attackIndex, params);
  const clamped = clampRowPicks(params.attacker, current, maxNet);

  const rowSame =
    rowEqual(clamped.picks, current.picks) &&
    rowEqual(clamped.plays, current.plays);

  if (rowSame) {
    return changed;
  }

  draft.wrapPicks[attackIndex] = clamped.picks;
  draft.characterPlayPicks[attackIndex] = clamped.plays;

  return true;
};
