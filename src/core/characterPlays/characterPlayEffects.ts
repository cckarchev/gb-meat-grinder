/** What a character play does to later swings, as numbers and as tooltip text. */

import { getCharacterPlay } from '@/core/characterPlays/characterPlayLookup';
import type {
  CharacterPlay,
  CharacterPlayPick,
  PickEffects,
} from '@/core/playbook/playbook.types';
import { ASSIST_DAMAGE_BONUS, ASSIST_TAC_BONUS } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

const ASSIST_NAME_SEPARATOR = ', ';
const ASSIST_ENGAGER_SEPARATOR = ' or ';

/** The play grants Assist and one of the named models engages the target. */
const assistApplies = (
  play: CharacterPlay | undefined,
  assistEngaged: boolean,
): boolean => {
  const grantsAssist = (play?.grantsAssist?.length ?? 0) > 0;

  return grantsAssist && assistEngaged;
};

export const characterPlayPickEffects = (
  attacker: AttackerData,
  pick: CharacterPlayPick,
  assistEngaged: boolean,
): PickEffects => {
  const play = getCharacterPlay(attacker, pick);
  const assist = assistApplies(play, assistEngaged);
  const assistTac = assist ? ASSIST_TAC_BONUS : 0;
  const assistDamage = assist ? ASSIST_DAMAGE_BONUS : 0;

  return {
    tacBonusForLater: (play?.tacBonusForLater ?? 0) + assistTac,
    defReductionForLater: play?.defReductionForLater ?? 0,
    armorReductionForLater: play?.armorReduction ?? 0,
    damageBonusForLater: assistDamage,
  };
};

/** True when this play changes the attack math (so a no-op like Snack Break is false). */
export const characterPlayHasEffect = (play: CharacterPlay): boolean => {
  return Boolean(
    play.tacBonusForLater ||
      play.defReductionForLater ||
      play.armorReduction ||
      play.damage ||
      play.currentHealthDivisor ||
      play.grantsAssist?.length,
  );
};

/** Human-readable effect + cadence, used for the selector tooltip / aria-label. */
export const characterPlayEffectSummary = (play: CharacterPlay): string => {
  const effects: string[] = [];

  if (play.damage) {
    effects.push(`${play.damage} DMG`);
  }

  if (play.currentHealthDivisor) {
    effects.push(
      `Condition DMG equal to 1/${play.currentHealthDivisor} of the target's ` +
        'current HP, rounded down',
    );
  }

  if (play.grantsAssist?.length) {
    const named = play.grantsAssist.join(ASSIST_NAME_SEPARATOR);
    const engagers = play.grantsAssist.join(ASSIST_ENGAGER_SEPARATOR);

    effects.push(
      `Assist [${named}]: +${ASSIST_TAC_BONUS} TAC and +${ASSIST_DAMAGE_BONUS} ` +
        'DMG to playbook damage results on later attacks while ' +
        `${engagers} engages the target`,
    );
  }

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

  const cadence = play.oncePerTurn ? ' Once per turn.' : '';

  return `${effect}${cadence}`;
};

/** The friendly models the attacker's Assist plays name, each once. */
export const assistNamedModels = (attacker: AttackerData): string[] => {
  const named = (attacker.characterPlays ?? []).flatMap((play) => {
    return play.grantsAssist ?? [];
  });

  return [...new Set(named)];
};
