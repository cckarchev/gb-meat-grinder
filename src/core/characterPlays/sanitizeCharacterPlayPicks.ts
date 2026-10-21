/** Repair character-play rows after the wrap picks or earlier plays changed. */

import type { ActivationOrderParams } from "@/core/attacks/attackSequence.types";
import { characterPlayAvailabilityForPick } from "@/core/characterPlays/characterPlayUsage";
import type { AttackPlan } from "@/core/plan/attackPlan.types";
import type { CharacterPlayPickSlot } from "@/core/playbook/playbook.types";
import { choiceUsesCharacterPlay } from "@/core/playbook/playbookIndex";

/**
 * Repair one play slot of `next` in place, and say whether it changed. Earlier
 * slots of `next` are already repaired, so this one sees them.
 */
const repairSlot = (
  order: ActivationOrderParams,
  wrapPicks: AttackPlan["wrapPicks"],
  next: CharacterPlayPickSlot[][],
  attackIndex: number,
  slot: number,
): boolean => {
  const pick = wrapPicks[attackIndex][slot];
  const usesPlay =
    pick != null && choiceUsesCharacterPlay(order.attacker, pick);

  if (!usesPlay) {
    if (next[attackIndex]?.[slot] == null) {
      return false;
    }

    next[attackIndex][slot] = null;

    return true;
  }

  const { available, depleted } = characterPlayAvailabilityForPick(
    order,
    { wrapPicks, characterPlayPicks: next },
    { attackIndex, pickIndex: slot },
  );

  if (depleted) {
    return false;
  }

  const current = next[attackIndex][slot];
  const currentIsAvailable = available.some((play) => play.id === current);

  if (current != null && currentIsAvailable) {
    return false;
  }

  next[attackIndex][slot] = available[0].id;

  return true;
};

/**
 * Fix play slots that no longer match their pick, or that hold a Once Per Turn
 * play an earlier pick already used.
 */
export const sanitizeCharacterPlayPicks = (
  order: ActivationOrderParams,
  plan: AttackPlan,
): { characterPlayPicks: CharacterPlayPickSlot[][]; changed: boolean } => {
  const { wrapPicks } = plan;
  const next: CharacterPlayPickSlot[][] = plan.characterPlayPicks.map((row) => [
    ...row,
  ]);

  let changed = false;

  for (let attackIndex = 0; attackIndex < wrapPicks.length; attackIndex++) {
    const picks = wrapPicks[attackIndex];

    for (let slot = 0; slot < picks.length; slot++) {
      const slotChanged = repairSlot(order, wrapPicks, next, attackIndex, slot);

      if (slotChanged) {
        changed = true;
      }
    }
  }

  return { characterPlayPicks: next, changed };
};
