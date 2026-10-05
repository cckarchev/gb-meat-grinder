/**
 * Keeps a wrap / character-play plan legal as the inputs that bound it change.
 */

import { activationAttackIndices, attackRowIsActive } from '@/core/attackRows';
import {
  defaultCharacterPlayId,
  sanitizeCharacterPlayPicksWrap,
} from '@/core/characterPlayPicks';
import { MIN_PLAYBOOK_NET } from '@/core/constants';
import { maxPlaybookNet } from '@/core/playbookIndex';
import { maxPlaybookColumnForRow } from '@/core/swingModifiers';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
  netSuccessesForChoice,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';
import type {
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  WrapPick,
} from '@/types/core/playbook';

/** Safety cap for the clamp fixpoint loop; real plans settle in a few passes. */
const MAX_CLAMP_PASSES = 30;

/** One attack's wrap picks with the character-play slot for each pick. */
type PlanRow = {
  picks: WrapPick[];
  plays: CharacterPlayPickSlot[];
};

const clonePlan = (plan: AttackPlan): AttackPlan => {
  return {
    wrapPicks: plan.wrapPicks.map((row) => [...row]),
    characterPlayPicks: plan.characterPlayPicks.map((row) => [...row]),
  };
};

const rowEqual = <T>(a: readonly T[], b: readonly T[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
};

const gridEqual = <T>(a: readonly T[][], b: readonly T[][]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((row, index) => rowEqual(row, b[index]));
};

/** Character-play slot a fresh pick starts with: the default play, if it uses one. */
const characterPlayFor = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): CharacterPlayPickSlot => {
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return null;
  }

  return defaultCharacterPlayId(attacker);
};

/** First line of the first playbook column: the fallback when nothing else fits. */
const cheapestChoiceId = (attacker: AttackerData): PlaybookChoiceId => {
  return attacker.playbook[0].results[0].id;
};

const firstReachableChoiceId = (
  attacker: AttackerData,
  maxNet: number,
): PlaybookChoiceId => {
  if (maxNet < MIN_PLAYBOOK_NET) {
    return cheapestChoiceId(attacker);
  }

  const targetNet = Math.min(maxNet, maxPlaybookNet(attacker));
  const column = attacker.playbook.find((c) => c.netSuccesses === targetNet);

  return column?.results[0].id ?? cheapestChoiceId(attacker);
};

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

/** Highest playbook column the given attack row can reach with the plan as it stands. */
const maxNetForRow = (
  plan: AttackPlan,
  attackIndex: number,
  params: AttackPlanClampParams,
): number => {
  return maxPlaybookColumnForRow(
    params.attacker,
    plan.wrapPicks,
    plan.characterPlayPicks,
    attackIndex,
    params.chargeAttackIndex,
    params.armor,
    params.enemyHasCover,
    params.enemyDefensiveStance,
    params.damageMods,
    params.enemyDef,
    params.bonusTimeByAttack,
    params.initialTacModifier,
    params.activeBaseCount,
  );
};

/** Only the first KD in activation order counts; later KD picks are replaced. */
const stripDuplicateKd = (
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
    const maxNet = maxNetForRow(draft, attackIndex, params);
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
      draft.characterPlayPicks[attackIndex][slot] = characterPlayFor(
        attacker,
        replacement,
      );

      changed = true;
    }
  }

  return changed;
};

/** Trim or pad the row to exactly `slotCount` slots, plays aligned with picks. */
const fitRowToSlotCount = (row: PlanRow, slotCount: number): PlanRow => {
  const picks = row.picks.slice(0, slotCount);
  const plays = row.plays.slice(0, slotCount);

  while (plays.length < picks.length) {
    plays.push(null);
  }

  while (picks.length < slotCount) {
    picks.push(null);
    plays.push(null);
  }

  return { picks, plays };
};

/**
 * Keep every pick within its slot budget: an over-budget first pick drops to the
 * best reachable line, an empty first pick empties the wrap, and over-budget
 * later picks are cleared. Mutates `row`.
 */
const fitPicksToBudget = (
  attacker: AttackerData,
  row: PlanRow,
  maxNet: number,
): void => {
  const { picks, plays } = row;
  const firstBudget = wrapSlotBudget(attacker, maxNet, 0);
  const first = picks[0];

  if (first != null && netSuccessesForChoice(attacker, first) > firstBudget) {
    const replacement = firstReachableChoiceId(attacker, firstBudget);

    picks[0] = replacement;
    plays[0] = characterPlayFor(attacker, replacement);
  }

  const wrapStarted = picks[0] != null;

  for (let slot = 1; slot < picks.length; slot++) {
    const id = picks[slot];
    const slotBudget = wrapSlotBudget(attacker, maxNet, slot);
    const overBudget =
      id != null && netSuccessesForChoice(attacker, id) > slotBudget;

    if (!wrapStarted || overBudget) {
      picks[slot] = null;
      plays[slot] = null;
    }
  }
};

/** Each play slot holds a play exactly when its pick uses one. Mutates `row`. */
const syncCharacterPlays = (attacker: AttackerData, row: PlanRow): void => {
  const { picks, plays } = row;

  for (let slot = 0; slot < picks.length; slot++) {
    const id = picks[slot];

    if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
      plays[slot] = null;
    } else if (plays[slot] == null) {
      plays[slot] = defaultCharacterPlayId(attacker);
    }
  }
};

const clampRowPicks = (
  attacker: AttackerData,
  row: PlanRow,
  maxNet: number,
): PlanRow => {
  if (maxNet < MIN_PLAYBOOK_NET) {
    return { picks: [null], plays: [null] };
  }

  const fitted = fitRowToSlotCount(row, wrapSlotCount(attacker, maxNet));

  fitPicksToBudget(attacker, fitted, maxNet);
  syncCharacterPlays(attacker, fitted);

  return fitted;
};

/**
 * One pass over a single attack row: align its play slots, empty it when the
 * row is inactive, and otherwise clamp its picks to what the row can reach.
 * Mutates `draft`; returns whether anything changed.
 */
const clampRow = (
  draft: AttackPlan,
  attackIndex: number,
  params: AttackPlanClampParams,
): boolean => {
  const { attacker } = params;
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

  const active = attackRowIsActive(
    attacker,
    draft.wrapPicks,
    attackIndex,
    params.damageMods,
    params.activeBaseCount,
  );

  if (!active) {
    if (picks.length === 0 && plays.length === 0) {
      return changed;
    }

    draft.wrapPicks[attackIndex] = [];
    draft.characterPlayPicks[attackIndex] = [];

    return true;
  }

  if (picks.length === 0) {
    draft.wrapPicks[attackIndex] = [null];
    draft.characterPlayPicks[attackIndex] = [null];
    changed = true;
  }

  const current: PlanRow = {
    picks: draft.wrapPicks[attackIndex],
    plays: draft.characterPlayPicks[attackIndex],
  };

  const maxNet = maxNetForRow(draft, attackIndex, params);
  const clamped = clampRowPicks(attacker, current, maxNet);

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
    let passChanged = false;

    for (
      let attackIndex = 0;
      attackIndex < draft.wrapPicks.length;
      attackIndex++
    ) {
      if (clampRow(draft, attackIndex, params)) {
        passChanged = true;
      }
    }

    if (stripDuplicateKd(draft, params)) {
      passChanged = true;
    }

    const sanitized = sanitizeCharacterPlayPicksWrap(
      params.attacker,
      draft.wrapPicks,
      draft.characterPlayPicks,
      params.damageMods,
      params.activeBaseCount,
    );

    if (sanitized.changed) {
      draft.characterPlayPicks = sanitized.characterPlayPicks;
      passChanged = true;
    }

    if (!passChanged) {
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
