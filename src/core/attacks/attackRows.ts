/** Which attack rows exist this activation and the order they are made in. */

import { berserkerRowOffset } from '@/core/attacks/attackStructure';
import { effectiveDamageForChoice } from '@/core/damage/damage';
import type {
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
export const baseAttackDealtDamage = (
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): boolean => {
  const offset = berserkerRowOffset(attacker);

  if (attackIndex < offset) {
    return attackIndex < activeBaseCount;
  }

  if (!attacker.berserker) {
    return false;
  }

  const b = berserkerSourceBaseIndex(attacker, attackIndex);

  if (b < 0 || b >= activeBaseCount) {
    return false;
  }

  return baseAttackDealtDamage(attacker, wrapPicks[b] ?? [], damageMods);
};

/**
 * Swing order: each active base, then its berserker (if any) before the next base.
 * Berserkers cannot be banked; they always resolve immediately after the base that earned them.
 */
export const activationAttackIndices = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] => {
  const out: number[] = [];
  const offset = berserkerRowOffset(attacker);

  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);

    if (!attacker.berserker) {
      continue;
    }

    const ber = offset + b;

    if (
      attackRowIsActive(attacker, wrapPicks, ber, damageMods, activeBaseCount)
    ) {
      out.push(ber);
    }
  }

  return out;
};
