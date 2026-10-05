/** Which playbook lines earn momentum once Tough Hide and buffs are applied. */

import { effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  MomentousLineStyle,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const momentousLineStyle = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle => {
  const r = getPlaybookResult(attacker, id);

  if (r.momentum !== true) {
    return 'none';
  }

  const dealsDamage = effectiveDamageForChoice(attacker, id, mods) > 0;

  return dealsDamage ? 'heat' : 'zeroed';
};

/**
 * True when this pick earns momentum on a hit: momentous on the card **and**
 * effective damage greater than 0 (same rule as the red playbook chip; Tough Hide can zero it out).
 */
export const pickGeneratesMomentum = (
  attacker: AttackerData,
  id: WrapPick | null | undefined,
  mods: PlaybookDamageMods,
): boolean => {
  if (id == null) {
    return false;
  }

  return momentousLineStyle(attacker, id, mods) === 'heat';
};
