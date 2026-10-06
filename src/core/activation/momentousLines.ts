/** Which playbook lines earn momentum once Tough Hide and buffs are applied. */

import { activeBuffs, effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  MomentousLineStyle,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import { MOMENTOUS_PICK_MOMENTUM } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** True if a selected buff makes every playbook damage result momentous (Maximum Effort). */
const buffsMakeDamageMomentous = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean => {
  return activeBuffs(attacker, mods).some(
    (buff) => buff.damageResultsMomentous === true,
  );
};

export const momentousLineStyle = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): MomentousLineStyle => {
  const result = getPlaybookResult(attacker, id);
  const printedDamage = result.damage > 0;
  const printedMomentous = result.momentum === true;
  const madeMomentous =
    printedDamage && buffsMakeDamageMomentous(attacker, mods);

  if (!printedMomentous && !madeMomentous) {
    return 'none';
  }

  // A momentous result with no printed damage is pure momentum: nothing can
  // negate it. Only a damage result reduced to 0 loses its momentum.

  if (!printedDamage) {
    return 'heat';
  }

  const dealsDamage = effectiveDamageForChoice(attacker, id, mods) > 0;

  return dealsDamage ? 'heat' : 'zeroed';
};

/**
 * True when this pick earns momentum on a hit: a momentous result without
 * printed damage always does; one with printed damage only while its effective
 * damage is above 0 (Tough Hide can zero it out).
 */
export const pickGeneratesMomentum = (
  attacker: AttackerData,
  id: WrapPick,
  mods: PlaybookDamageMods,
): boolean => {
  if (id == null) {
    return false;
  }

  return momentousLineStyle(attacker, id, mods) === 'heat';
};

/** Momentum one swing's picks earn on a hit: one per pick that generates it. */
export const momentumEarnedBySwing = (
  attacker: AttackerData,
  picks: readonly WrapPick[],
  mods: PlaybookDamageMods,
): number => {
  const momentousPicks = picks.filter((id) => {
    return pickGeneratesMomentum(attacker, id, mods);
  });

  return momentousPicks.length * MOMENTOUS_PICK_MOMENTUM;
};
