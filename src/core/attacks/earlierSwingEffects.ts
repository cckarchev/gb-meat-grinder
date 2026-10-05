/** What earlier swings in the activation leave behind for a later one: cover cleared, TAC and DEF carry-over. */

import { picksOnEarlierSwings } from '@/core/attacks/attackRows';
import {
  coverSwingClockIndices,
  wrapPickClearsCover,
} from '@/core/playbook/coverClearing';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { rowEffectsForPick } from '@/core/playbook/rowEffects';
import { COVER_TAC_PENALTY } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Cover: `COVER_TAC_PENALTY` fewer dice on this attack while the enemy is in terrain.
 * Push (>) or double push (>>) on any **earlier** attack in activation order
 * (base → berserker → …) clears that terrain benefit on later swings.
 */
export const coverTacPenaltyForAttack = (
  attacker: AttackerData,
  enemyHasCover: boolean,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  activeBaseCount: number,
): number => {
  if (!enemyHasCover) {
    return 0;
  }

  /* Use fixed base → berserker clock so > / >> are never skipped when a berserker
   * row is omitted from `activationAttackIndices` (damage-gated). */
  const clock = coverSwingClockIndices(attacker, activeBaseCount);
  const clockPosition = clock.indexOf(attackIndex);

  if (clockPosition < 0) {
    return COVER_TAC_PENALTY;
  }

  for (let position = 0; position < clockPosition; position++) {
    const earlierIndex = clock[position];
    const row = wrapPicks[earlierIndex];

    if (!row?.length) {
      continue;
    }

    for (let pickIndex = 0; pickIndex < row.length; pickIndex++) {
      if (wrapPickClearsCover(attacker, row[pickIndex])) {
        return 0;
      }
    }
  }

  return COVER_TAC_PENALTY;
};

/**
 * Modifiers from all picks on attacks strictly before `attackIndex` in activation order
 * (base → its berserker → next base → …).
 */
export const modifiersBeforeAttack = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { tacBonus: number; defReduction: number } => {
  const earlierPicks = picksOnEarlierSwings(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    attackIndex,
  );

  let tacBonus = 0;
  let defReduction = 0;

  for (const earlier of earlierPicks) {
    const effects = rowEffectsForPick(
      attacker,
      wrapPicks,
      characterPlayPicks,
      earlier.attackIndex,
      earlier.pickIndex,
      damageMods,
      activeBaseCount,
    );

    tacBonus += effects.tacBonusForLater;
    defReduction += effects.defReductionForLater;
  }

  return { tacBonus, defReduction };
};
