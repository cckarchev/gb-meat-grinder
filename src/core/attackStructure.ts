import { activeAttacker } from '@/attackers/activeAttacker';
import type { AttackerData } from '@/types/core/attacker';

/**
 * Influence the charge consumes: free for Furious models, otherwise 2.
 * 0 when the model is not charging.
 */
export function chargeInfluenceCost(
  charging: boolean,
  attacker: AttackerData = activeAttacker,
): number {
  if (!charging) return 0;
  return attacker.furious ? 0 : 2;
}

/**
 * Base (non-Berserker) attacks this activation: the charge (if any), one bought
 * per remaining influence, plus a free Feral attack. Berserkers are derived from
 * these, not counted here.
 */
export function activeBaseAttackCount(
  influence: number,
  charging: boolean,
  attacker: AttackerData = activeAttacker,
): number {
  const bought = Math.max(0, influence - chargeInfluenceCost(charging, attacker));
  return (charging ? 1 : 0) + bought + (attacker.feral ? 1 : 0);
}

/**
 * Most base attacks the model can ever field (all influence on attacks, plus the
 * free charge/Feral). Fixes the array layout so rows keep stable indices as the
 * allocated influence changes.
 */
export function maxBaseAttackCount(
  attacker: AttackerData = activeAttacker,
): number {
  return attacker.inf + (attacker.furious ? 1 : 0) + (attacker.feral ? 1 : 0);
}

/** Berserker rows live at `maxBaseAttackCount + baseIndex`, so this is the offset. */
export function berserkerRowOffset(
  attacker: AttackerData = activeAttacker,
): number {
  return maxBaseAttackCount(attacker);
}

/** Total rows the attack-plan arrays reserve (bases + one Berserker slot each). */
export function attackArraySize(
  attacker: AttackerData = activeAttacker,
): number {
  const base = maxBaseAttackCount(attacker);
  return attacker.berserker ? base * 2 : base;
}
