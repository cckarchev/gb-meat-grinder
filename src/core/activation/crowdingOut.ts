/** Which crowding out values the scenario allows. */

import { activeBuffs } from '@/core/attackers/buffsAndTraits';
import type { PlaybookDamageMods } from '@/core/playbook/playbook.types';
import type { AttackerData, StatRange } from '@/data/attackers/attacker.types';

/** The only crowding out left while the attacker ignores its penalty. */
const IGNORED_CROWDING_OUT = 0;

/**
 * The attacker's crowding out range. A buff that ignores the crowding out
 * penalty (One at a Time Lads!) pins it at 0.
 */
export const crowdingOutRange = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): StatRange => {
  const ignored = activeBuffs(attacker, mods).some(
    (buff) => buff.ignoresCrowdingOut === true,
  );

  if (!ignored) {
    return attacker.crowdingOut;
  }

  return { min: IGNORED_CROWDING_OUT, max: IGNORED_CROWDING_OUT };
};
