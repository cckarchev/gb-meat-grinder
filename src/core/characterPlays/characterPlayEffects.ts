/** What a character play does to later swings, as numbers and as tooltip text. */

import { getCharacterPlay } from '@/core/characterPlays/characterPlayLookup';
import type {
  CharacterPlay,
  CharacterPlayPick,
  PickEffects,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const characterPlayPickEffects = (
  attacker: AttackerData,
  pick: CharacterPlayPick,
): PickEffects => {
  const play = getCharacterPlay(attacker, pick);

  return {
    tacBonusForLater: play?.tacBonusForLater ?? 0,
    defReductionForLater: play?.defReductionForLater ?? 0,
    armorReduction: play?.armorReduction ?? 0,
  };
};

/** True when this play changes the attack math (so a no-op like Snack Break is false). */
export const characterPlayHasEffect = (play: CharacterPlay): boolean => {
  return Boolean(
    play.tacBonusForLater || play.defReductionForLater || play.armorReduction,
  );
};

/** Human-readable effect + cadence, used for the selector tooltip / aria-label. */
export const characterPlayEffectSummary = (play: CharacterPlay): string => {
  const effects: string[] = [];

  if (play.tacBonusForLater) {
    effects.push(`+${play.tacBonusForLater} TAC on later attacks`);
  }

  if (play.defReductionForLater) {
    effects.push(`-${play.defReductionForLater} enemy DEF on later attacks`);
  }

  if (play.armorReduction) {
    effects.push(`-${play.armorReduction} enemy ARM on later attacks`);
  }

  const effect = effects.length
    ? `${effects.join('; ')}.`
    : 'No effect on the attack math.';

  const cadence = play.repeatable ? 'Repeatable.' : 'Once per turn.';

  return `${effect} ${cadence}`;
};
