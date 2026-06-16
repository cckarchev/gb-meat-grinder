import type { AttackRollContext } from '@/types/core/attackSequence';

/**
 * Display index into `attacks` of the swing that first brings the target to 0
 * HP under the deterministic "every pick hits" projection, or -1 if the target
 * survives the whole activation. `flatDamage` is guaranteed special-ability
 * damage applied before any swing; `rowDamageIfHit` is indexed by attackIndex.
 */
export function killingBlowDisplayIndex(
  attacks: readonly AttackRollContext[],
  rowDamageIfHit: readonly number[],
  flatDamage: number,
  targetHp: number,
): number {
  let dealt = flatDamage;
  for (let idx = 0; idx < attacks.length; idx++) {
    dealt += rowDamageIfHit[attacks[idx].attackIndex] ?? 0;
    if (dealt >= targetHp) return idx;
  }
  return -1;
}
