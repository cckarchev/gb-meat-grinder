import { BASE_ATTACK_COUNT } from '@/core/constants';
import { attackRowIsBerserker } from '@/core/playbook';
import type { AttackBlockVariant } from '@/types/components/attacks';

export function attackBlockVariant(
  attackIndex: number,
  chargeAttackIndex: number,
): AttackBlockVariant {
  if (attackRowIsBerserker(attackIndex)) return 'berserker';
  if (attackIndex < BASE_ATTACK_COUNT && attackIndex === chargeAttackIndex) {
    return 'charge';
  }
  return 'base';
}

export function attackKindLabel(
  attackIndex: number,
  chargeAttackIndex: number,
): string {
  if (attackRowIsBerserker(attackIndex)) return 'Berserker attack';
  if (attackIndex === chargeAttackIndex) return 'Charge attack';
  return 'Base attack';
}
