import { attackRowIsBerserker } from '@/core/playbook';
import type { AttackBlockVariant } from '@/types/components/attacks';
import type { AttackerData } from '@/types/core/attacker';

export function attackBlockVariant(
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
): AttackBlockVariant {
  if (attackRowIsBerserker(attacker, attackIndex)) return 'berserker';
  if (attackIndex === chargeAttackIndex) {
    return 'charge';
  }
  return 'base';
}

export function attackKindLabel(
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
): string {
  if (attackRowIsBerserker(attacker, attackIndex)) return 'Berserker attack';
  if (attackIndex === chargeAttackIndex) return 'Charge attack';
  return 'Base attack';
}
