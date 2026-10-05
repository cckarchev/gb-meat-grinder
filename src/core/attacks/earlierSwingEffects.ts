/** What earlier swings in the activation leave behind for a later one: cover cleared, TAC and DEF carry-over. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
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
 * Cover: −1 TAC on this attack’s dice pool while the enemy is in terrain.
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
  const pos = clock.indexOf(attackIndex);

  if (pos < 0) {
    return COVER_TAC_PENALTY;
  }

  for (let p = 0; p < pos; p++) {
    const j = clock[p];
    const row = wrapPicks[j];

    if (!row?.length) {
      continue;
    }

    for (let k = 0; k < row.length; k++) {
      if (wrapPickClearsCover(attacker, row[k])) {
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
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return { tacBonus: 0, defReduction: 0 };
  }

  let tacBonus = 0;
  let defReduction = 0;

  for (let oi = 0; oi < targetPos; oi++) {
    const j = order[oi];

    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) {
        continue;
      }

      const m = rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
        activeBaseCount,
      );

      tacBonus += m.tacBonusForLater;
      defReduction += m.defReductionForLater;
    }
  }

  return { tacBonus, defReduction };
};
