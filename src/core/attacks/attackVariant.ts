import { attackRowIsBerserker } from '@/core/attacks/attackRows';
import type { AttackBlockVariant } from '@/core/attacks/attackSequence.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

const ATTACK_KIND_LABEL: Record<AttackBlockVariant, string> = {
  berserker: 'Berserker attack',
  charge: 'Charge attack',
  base: 'Base attack',
};

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
  const variant = attackBlockVariant(attacker, attackIndex, chargeAttackIndex);

  return ATTACK_KIND_LABEL[variant];
};
