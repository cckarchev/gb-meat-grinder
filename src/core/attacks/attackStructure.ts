import { clamp } from '@/core/shared/clamp';
import {
  BERSERKER_ROWS_PER_BASE,
  CHARGE_ATTACK_COUNT,
  CHARGE_INFLUENCE_COST,
  FERAL_ATTACK_COUNT,
  NO_ATTACK_INDEX,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Influence the charge consumes: free for Furious models, otherwise 2.
 * 0 when the model is not charging.
 */
export const chargeInfluenceCost = (
  attacker: AttackerData,
  charging: boolean,
): number => {
  if (!charging) {
    return 0;
  }

  return attacker.furious ? 0 : CHARGE_INFLUENCE_COST;
};

/**
 * Base (non-Berserker) attacks this activation: the charge (if any), one bought
 * per remaining influence, plus a free Feral attack. Berserkers are derived from
 * these, not counted here.
 */
export const activeBaseAttackCount = (
  attacker: AttackerData,
  influence: number,
  charging: boolean,
): number => {
  const bought = Math.max(
    0,
    influence - chargeInfluenceCost(attacker, charging),
  );

  const chargeAttacks = charging ? CHARGE_ATTACK_COUNT : 0;
  const feralAttacks = attacker.feral ? FERAL_ATTACK_COUNT : 0;

  return chargeAttacks + bought + feralAttacks;
};

/** Keep the chosen charge row on one of the active base attacks (row 0 at least). */
export const clampChargeAttackIndex = (
  index: number,
  activeBaseCount: number,
): number => {
  const lastBaseIndex = activeBaseCount - 1;

  return clamp(index, 0, lastBaseIndex);
};

/** Charge row the engine uses: the chosen base, or none when not charging. */
export const effectiveChargeIndex = (
  charging: boolean,
  chargeAttackIndex: number,
): number => {
  return charging ? chargeAttackIndex : NO_ATTACK_INDEX;
};

/**
 * Most base attacks the model can ever field (all influence on attacks, plus the
 * free charge/Feral). Fixes the array layout so rows keep stable indices as the
 * allocated influence changes.
 */
export const maxBaseAttackCount = (attacker: AttackerData): number => {
  const furiousAttacks = attacker.furious ? CHARGE_ATTACK_COUNT : 0;
  const feralAttacks = attacker.feral ? FERAL_ATTACK_COUNT : 0;

  return attacker.inf + furiousAttacks + feralAttacks;
};

/** Berserker rows live at `maxBaseAttackCount + baseIndex`, so this is the offset. */
export const berserkerRowOffset = (attacker: AttackerData): number => {
  return maxBaseAttackCount(attacker);
};

/** Total rows the attack-plan arrays reserve (bases + one Berserker slot each). */
export const attackArraySize = (attacker: AttackerData): number => {
  const base = maxBaseAttackCount(attacker);

  if (!attacker.berserker) {
    return base;
  }

  return base + base * BERSERKER_ROWS_PER_BASE;
};
