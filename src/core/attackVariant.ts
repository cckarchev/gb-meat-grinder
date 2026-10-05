import { attackRowIsBerserker } from '@/core/attackRows';
import type { AttackerData } from '@/types/core/attacker';
import type { AttackBlockVariant } from '@/types/core/attackSequence';

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
