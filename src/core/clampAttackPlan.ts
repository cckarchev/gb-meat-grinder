/**
 * Keeps a wrap / character-play plan legal as the inputs that bound it change.
 */

import { sanitizeCharacterPlayPicksWrap } from '@/core/characterPlayPicks';
import { clampAttackRow } from '@/core/clampAttackRow';
import { stripDuplicateKnockDown } from '@/core/clampKnockDown';
import { gridEqual } from '@/core/gridEqual';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';

/** Safety cap for the clamp fixpoint loop; real plans settle in a few passes. */
const MAX_CLAMP_PASSES = 30;

const clonePlan = (plan: AttackPlan): AttackPlan => {
  return {
    wrapPicks: plan.wrapPicks.map((row) => [...row]),
    characterPlayPicks: plan.characterPlayPicks.map((row) => [...row]),
  };
};

/** Re-check play picks that depend on earlier GB / 1GB choices. Mutates `draft`. */
const sanitizeCharacterPlays = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
): boolean => {
  const sanitized = sanitizeCharacterPlayPicksWrap(
    params.attacker,
    draft.wrapPicks,
    draft.characterPlayPicks,
    params.damageMods,
    params.activeBaseCount,
  );

  if (!sanitized.changed) {
    return false;
  }

  draft.characterPlayPicks = sanitized.characterPlayPicks;

  return true;
};

/** One full pass: every row, then the KD rule, then the play picks. */
const clampPass = (
  draft: AttackPlan,
  params: AttackPlanClampParams,
): boolean => {
  let changed = false;

  for (const attackIndex of draft.wrapPicks.keys()) {
    if (clampAttackRow(draft, attackIndex, params)) {
      changed = true;
    }
  }

  if (stripDuplicateKnockDown(draft, params)) {
    changed = true;
  }

  if (sanitizeCharacterPlays(draft, params)) {
    changed = true;
  }

  return changed;
};

/**
 * Keeps each attack's wrap within TAC - ARM: drop tail picks until valid, then
 * sanitize character-play picks after GB / 1GB. Inactive rows (base rows beyond
 * the allocated influence, or damage-less berserkers) are emptied. Repeats until
 * a pass changes nothing, since fixing one row can shift what later rows reach.
 * Returns `plan` itself when it was already legal.
 */
export const clampAttackPlan = (
  plan: AttackPlan,
  params: AttackPlanClampParams,
): AttackPlan => {
  const draft = clonePlan(plan);

  for (let pass = 0; pass < MAX_CLAMP_PASSES; pass++) {
    if (!clampPass(draft, params)) {
      break;
    }
  }

  const unchanged =
    gridEqual(draft.wrapPicks, plan.wrapPicks) &&
    gridEqual(draft.characterPlayPicks, plan.characterPlayPicks);

  if (unchanged) {
    return plan;
  }

  return draft;
};
