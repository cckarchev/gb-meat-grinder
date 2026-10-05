import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';

/**
 * Display index into `attacks` of the swing that first brings the target to 0
 * HP under the deterministic "every pick hits" projection, or -1 if the target
 * survives the whole activation. `flatDamage` is guaranteed special-ability
 * damage applied before any swing; `rowDamageIfHit` is indexed by attackIndex.
 */
export const killingBlowDisplayIndex = (
  attacks: readonly AttackRollContext[],
  rowDamageIfHit: readonly number[],
  flatDamage: number,
  targetHp: number,
): number => {
  let dealt = flatDamage;

  for (let displayIndex = 0; displayIndex < attacks.length; displayIndex++) {
    dealt += rowDamageIfHit[attacks[displayIndex].attackIndex] ?? 0;

    if (dealt >= targetHp) {
      return displayIndex;
    }
  }

  return NO_ATTACK_INDEX;
};
