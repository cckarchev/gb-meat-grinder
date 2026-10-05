/** What a character play does to later swings, as numbers and as tooltip text. */

import { getCharacterPlay } from '@/core/characterPlays/characterPlayLookup';
import type {
  CharacterPlay,
  CharacterPlayPick,
  PickEffects,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const characterPlayPickModifiers = (
  attacker: AttackerData,
  pick: CharacterPlayPick,
): PickEffects => {
  const cp = getCharacterPlay(attacker, pick);

  return {
    tacBonusForLater: cp?.tacBonusForLater ?? 0,
    defReductionForLater: cp?.defReductionForLater ?? 0,
    armorReduction: cp?.armorReduction ?? 0,
  };
};

/** True when this play changes the attack math (so a no-op like Snack Break is false). */
export const characterPlayHasEffect = (cp: CharacterPlay): boolean => {
  return Boolean(
    cp.tacBonusForLater || cp.defReductionForLater || cp.armorReduction,
  );
};

/** Human-readable effect + cadence, used for the selector tooltip / aria-label. */
export const characterPlayEffectSummary = (cp: CharacterPlay): string => {
  const effects: string[] = [];

  if (cp.tacBonusForLater) {
    effects.push(`+${cp.tacBonusForLater} TAC on later attacks`);
  }

  if (cp.defReductionForLater) {
    effects.push(`−${cp.defReductionForLater} enemy DEF on later attacks`);
  }

  if (cp.armorReduction) {
    effects.push(`−${cp.armorReduction} enemy ARM on later attacks`);
  }

  const effect = effects.length
    ? `${effects.join('; ')}.`
    : 'No effect on the attack math.';

  const cadence = cp.repeatable ? 'Repeatable.' : 'Once per turn.';

  return `${effect} ${cadence}`;
};
