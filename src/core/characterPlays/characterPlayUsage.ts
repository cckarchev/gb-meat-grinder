/** Once Per Turn bookkeeping: which plays earlier picks used up and which remain. */

import { picksBeforeInActivation } from '@/core/attacks/attackRows';
import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import {
  characterPlaysForAttacker,
  effectivePlayForPick,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import type { AttackPlan, PickPosition } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlay,
  CharacterPlayPick,
  CharacterPlayUsage,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Character plays already taken on picks strictly before `(attackIndex,
 * pickIndex)` in activation order (base then its berserker, then next base, …).
 */
export const characterPlayUsageBeforePick = (
  order: ActivationOrderParams,
  plan: AttackPlan,
  position: PickPosition,
): CharacterPlayUsage => {
  const { attacker } = order;
  const used = new Set<CharacterPlayPick>();

  const earlierPicks = picksBeforeInActivation(order, plan.wrapPicks, position);

  for (const earlier of earlierPicks) {
    if (!choiceUsesCharacterPlay(attacker, earlier.id)) {
      continue;
    }

    const play = effectivePlayForPick(
      attacker,
      plan.characterPlayPicks,
      earlier.attackIndex,
      earlier.pickIndex,
    );

    // Plays that are not Once Per Turn may be picked again, so they never count
    // as used up. Their effect still applies once (same name, see the timeline).
    const oncePerTurn = getCharacterPlay(attacker, play)?.oncePerTurn === true;

    if (play != null && oncePerTurn) {
      used.add(play);
    }
  }

  return used;
};

/** The attacker's plays that are not in `used`. */
const unusedCharacterPlays = (
  attacker: AttackerData,
  used: CharacterPlayUsage,
): CharacterPlay[] => {
  return characterPlaysForAttacker(attacker).filter(
    (play) => !used.has(play.id),
  );
};

/** Character plays still choosable on this pick (those not used by earlier picks). */
export const characterPlayAvailabilityForPick = (
  order: ActivationOrderParams,
  plan: AttackPlan,
  position: PickPosition,
): { available: readonly CharacterPlay[]; depleted: boolean } => {
  const used = characterPlayUsageBeforePick(order, plan, position);
  const available = unusedCharacterPlays(order.attacker, used);

  return { available, depleted: available.length === 0 };
};
