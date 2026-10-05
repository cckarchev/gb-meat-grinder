/** Damage one roll deals when you stick to the playbook lines you picked. */

import { effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  getPlaybookResult,
  maxPlaybookNet,
  netSuccessesForChoice,
} from '@/core/playbook/playbookIndex';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Damage a swing deals besides its card results, by where it lands. */
type SwingDamageExtras = {
  /** Effective play damage triggered on each slot, added when that slot reaches its line. */
  playDamageBySlot: readonly number[];
  /** Unmodified charge damage (Sweeping Charge), added when the roll lands on a damage result. */
  chargeTraitDamage: number;
};

const NO_EXTRAS: SwingDamageExtras = {
  playDamageBySlot: [],
  chargeTraitDamage: 0,
};

/** Whether any line in a column within `budget` has printed damage. */
const damageLineWithinBudget = (
  attacker: AttackerData,
  budget: number,
): boolean => {
  return attacker.playbook.some((column) => {
    const affordable =
      column.netSuccesses >= MIN_PLAYBOOK_NET && column.netSuccesses <= budget;

    return affordable && column.results.some((result) => result.damage > 0);
  });
};

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
  extras: SwingDamageExtras = NO_EXTRAS,
): number => {
  if (net < MIN_PLAYBOOK_NET) {
    return 0;
  }

  const maxNet = maxPlaybookNet(attacker);
  let total = 0;
  let reachedDamageResult = false;

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

    if (!reachesPickedLine) {
      total += bestDamageWithinBudget(attacker, mods, slotBudget);

      if (damageLineWithinBudget(attacker, slotBudget)) {
        reachedDamageResult = true;
      }

      continue;
    }

    const playDamage = extras.playDamageBySlot[slot] ?? 0;

    total += effectiveDamageForChoice(attacker, id, mods) + playDamage;

    if (getPlaybookResult(attacker, id).damage > 0) {
      reachedDamageResult = true;
    }
  }

  return reachedDamageResult ? total + extras.chargeTraitDamage : total;
};
