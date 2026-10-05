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
import { pickEffectsForLaterSwings } from '@/core/playbook/rowEffects';
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

  const earlierSwings = clock.slice(0, clockPosition);

  const coverCleared = earlierSwings.some((earlierIndex) => {
    const row = wrapPicks[earlierIndex] ?? [];

    return row.some((id) => wrapPickClearsCover(attacker, id));
  });

  return coverCleared ? 0 : COVER_TAC_PENALTY;
};

/**
 * TAC and DEF effects carried from every pick on attacks strictly before
 * `attackIndex` in activation order (base → its berserker → next base → …).
 */
export const carriedEffectsBeforeAttack = (
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
    const effects = pickEffectsForLaterSwings(
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
