/** Damage one roll deals when you stick to the playbook lines you picked. */

import { effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  maxPlaybookNet,
  netSuccessesForChoice,
} from '@/core/playbook/playbookIndex';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Most card damage reachable in a single playbook column within `budget` net. */
const bestDamageWithinBudget = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
  budget: number,
): number => {
  let best = 0;

  for (const column of attacker.playbook) {
    const tooCheap = column.netSuccesses < MIN_PLAYBOOK_NET;
    const overBudget = column.netSuccesses > budget;

    if (tooCheap || overBudget) {
      continue;
    }

    for (const result of column.results) {
      const damage = effectiveDamageForChoice(attacker, result.id, mods);

      if (damage > best) {
        best = damage;
      }
    }
  }

  return best;
};

/**
 * Damage a roll of `net` net successes deals if you stick to the lines you
 * actually picked: each picked slot deals its line's damage once the roll
 * reaches it, otherwise the best lower column that slot can reach. Over-rolls
 * give nothing extra (you committed to these picks, not max damage).
 */
export const pickedDamageForNet = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
  picks: readonly WrapPick[],
  net: number,
): number => {
  if (net < MIN_PLAYBOOK_NET) {
    return 0;
  }

  const maxNet = maxPlaybookNet(attacker);
  let total = 0;

  for (let slot = 0; slot < picks.length; slot++) {
    const netSpentOnEarlierSlots = slot * maxNet;
    const slotBudget = Math.min(maxNet, net - netSpentOnEarlierSlots);

    if (slotBudget < MIN_PLAYBOOK_NET) {
      break;
    }

    const id = picks[slot];

    if (id == null) {
      continue;
    }

    const reachesPickedLine = slotBudget >= netSuccessesForChoice(attacker, id);

    total += reachesPickedLine
      ? effectiveDamageForChoice(attacker, id, mods)
      : bestDamageWithinBudget(attacker, mods, slotBudget);
  }

  return total;
};
