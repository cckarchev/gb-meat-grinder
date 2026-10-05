/** Cover: which picks clear it and the fixed swing order used to check them. */

import { berserkerRowOffset } from '@/core/attacks/attackStructure';
import type { WrapPick } from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** True if this pick removes the enemy's cover (a push / double push result). */
export const wrapPickClearsCover = (
  attacker: AttackerData,
  id: WrapPick,
): boolean => {
  if (id == null) {
    return false;
  }

  return getPlaybookResult(attacker, id).clearsCover === true;
};

/**
 * Fixed GB swing order for cover: each base then its berserker, regardless of
 * whether the berserker row is “active” for damage (so > / >> are never skipped).
 */
export const coverSwingClockIndices = (
  attacker: AttackerData,
  activeBaseCount: number,
): number[] => {
  const indices: number[] = [];
  const offset = berserkerRowOffset(attacker);

  for (let baseIndex = 0; baseIndex < activeBaseCount; baseIndex++) {
    indices.push(baseIndex);

    if (attacker.berserker) {
      indices.push(offset + baseIndex);
    }
  }

  return indices;
};
