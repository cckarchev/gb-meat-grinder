import { attackRowIsBerserker } from '@/core/attacks/attackRows';
import type { AttackBlockVariant } from '@/core/attacks/attackSequence.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const attackBlockVariant = (
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
): AttackBlockVariant => {
  if (attackRowIsBerserker(attacker, attackIndex)) {
    return 'berserker';
  }

  if (attackIndex === chargeAttackIndex) {
    return 'charge';
  }

  return 'base';
};

export const attackKindLabel = (
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
): string => {
  if (attackRowIsBerserker(attacker, attackIndex)) {
    return 'Berserker attack';
  }

  if (attackIndex === chargeAttackIndex) {
    return 'Charge attack';
  }

  return 'Base attack';
};
