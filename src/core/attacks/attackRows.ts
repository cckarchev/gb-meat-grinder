/** Which attack rows exist this activation and the order they are made in. */

import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import { berserkerRowOffset } from '@/core/attacks/attackStructure';
import { effectiveDamageForChoice } from '@/core/damage/damage';
import type { PickPosition } from '@/core/plan/attackPlan.types';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Rows below the berserker offset are base attacks; at/above it are berserkers. */
export const attackRowIsBerserker = (
  attacker: AttackerData,
  attackIndex: number,
): boolean => {
  return attackIndex >= berserkerRowOffset(attacker);
};

export const berserkerSourceBaseIndex = (
  attacker: AttackerData,
  attackIndex: number,
): number => {
  return attackIndex - berserkerRowOffset(attacker);
};

/** True if this base attack includes any non-null wrap line with modified playbook damage > 0. */
export const basePicksDealDamage = (
  attacker: AttackerData,
  picks: WrapPick[],
  damageMods: PlaybookDamageMods,
): boolean => {
  return picks.some(
    (id) =>
      id != null && effectiveDamageForChoice(attacker, id, damageMods) > 0,
  );
};

/**
 * Base rows are active while their index is within the allocated base count;
 * berserker rows are active only for Berserker models when their source base is
 * active and dealt damage.
 */
export const attackRowIsActive = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  attackIndex: number,
): boolean => {
  const { attacker, damageMods, activeBaseCount } = order;
  const offset = berserkerRowOffset(attacker);

  if (attackIndex < offset) {
    return attackIndex < activeBaseCount;
  }

  if (!attacker.berserker) {
    return false;
  }

  const sourceBaseIndex = berserkerSourceBaseIndex(attacker, attackIndex);

  if (sourceBaseIndex < 0 || sourceBaseIndex >= activeBaseCount) {
    return false;
  }

  return basePicksDealDamage(
    attacker,
    wrapPicks[sourceBaseIndex] ?? [],
    damageMods,
  );
};

/**
 * Swing order: each active base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked; they always resolve immediately after the base that earned them.
 */
export const activationAttackIndices = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
): number[] => {
  const { attacker, activeBaseCount } = order;
  const indices: number[] = [];
  const offset = berserkerRowOffset(attacker);

  for (let baseIndex = 0; baseIndex < activeBaseCount; baseIndex++) {
    indices.push(baseIndex);

    if (!attacker.berserker) {
      continue;
    }

    const berserkerIndex = offset + baseIndex;

    if (attackRowIsActive(order, wrapPicks, berserkerIndex)) {
      indices.push(berserkerIndex);
    }
  }

  return indices;
};

/** A non-empty wrap slot and where it sits in the plan. */
type PlacedPick = PickPosition & {
  id: PlaybookChoiceId;
};

/**
 * Every non-empty pick strictly before `(attackIndex, pickIndex)` in activation
 * order: all picks of earlier swings, then this swing's picks before `pickIndex`.
 * Pass `pickIndex` 0 for just the earlier swings. Empty when the swing is not
 * part of the activation.
 */
export const picksBeforeInActivation = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  position: PickPosition,
): PlacedPick[] => {
  const { attackIndex, pickIndex } = position;
  const swingOrder = activationAttackIndices(order, wrapPicks);
  const orderPosition = swingOrder.indexOf(attackIndex);

  if (orderPosition < 0) {
    return [];
  }

  const placed: PlacedPick[] = [];

  for (const swingIndex of swingOrder.slice(0, orderPosition + 1)) {
    const swingPicks = wrapPicks[swingIndex];
    const isTargetSwing = swingIndex === attackIndex;
    const picksToTake = isTargetSwing ? pickIndex : swingPicks.length;

    for (let slot = 0; slot < picksToTake; slot++) {
      const id = swingPicks[slot];

      if (id == null) {
        continue;
      }

      placed.push({ attackIndex: swingIndex, pickIndex: slot, id });
    }
  }

  return placed;
};
