/**
 * Character plays triggered by GB results: lookup, usage limits and sanitizing.
 */

import { activationAttackIndices } from '@/core/attackRows';
import { choiceUsesCharacterPlay } from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlay,
  CharacterPlayPick,
  CharacterPlayPickSlot,
  CharacterPlayUsage,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

/** Character plays this attacker's GB / 1GB results can trigger (from the catalog). */
const characterPlaysForAttacker = (
  attacker: AttackerData,
): readonly CharacterPlay[] => {
  return attacker.characterPlays ?? [];
};

export const getCharacterPlay = (
  attacker: AttackerData,
  id: CharacterPlayPick | null,
): CharacterPlay | undefined => {
  if (id == null) {
    return undefined;
  }

  return characterPlaysForAttacker(attacker).find((c) => c.id === id);
};

/** Play picked by default when a GB result is chosen: the first guild play. */
export const defaultCharacterPlayId = (
  attacker: AttackerData,
): CharacterPlayPick | null => {
  return characterPlaysForAttacker(attacker)[0]?.id ?? null;
};

/** Play slot a freshly placed pick starts with: the default play, if it uses one. */
export const initialCharacterPlayFor = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): CharacterPlayPickSlot => {
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return null;
  }

  return defaultCharacterPlayId(attacker);
};

export const characterPlayPickModifiers = (
  attacker: AttackerData,
  pick: CharacterPlayPick,
): {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReduction: number;
} => {
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

/**
 * Character plays already taken on picks strictly before `(attackIndex,
 * pickIndex)` in activation order (base then its berserker, then next base, …).
 */
export const characterPlayUsageBeforePick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): CharacterPlayUsage => {
  const used = new Set<string>();

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return used;
  }

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;

    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];

      if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
        continue;
      }

      const f = characterPlayPicks[j]?.[k] ?? defaultCharacterPlayId(attacker);

      // Repeatable plays may be taken again and stack, so they never count as
      // "used up": they stay available and keep applying on later swings.
      if (f != null && getCharacterPlay(attacker, f)?.repeatable !== true) {
        used.add(f);
      }
    }
  }

  return used;
};

/** Character plays still choosable on this pick (those not used by earlier picks). */
export const characterPlayAvailabilityForPick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { available: readonly CharacterPlay[]; depleted: boolean } => {
  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );

  const available = characterPlaysForAttacker(attacker).filter(
    (cp) => !used.has(cp.id),
  );

  return { available, depleted: available.length === 0 };
};

/** Fix illegal character-play rows when earlier picks consumed SO or Stagger. */
export const sanitizeCharacterPlayPicksWrap = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { characterPlayPicks: CharacterPlayPickSlot[][]; changed: boolean } => {
  const next: CharacterPlayPickSlot[][] = characterPlayPicks.map((row) => [
    ...row,
  ]);

  let changed = false;

  for (let i = 0; i < wrapPicks.length; i++) {
    for (let k = 0; k < wrapPicks[i].length; k++) {
      if (
        wrapPicks[i][k] == null ||
        !choiceUsesCharacterPlay(attacker, wrapPicks[i][k])
      ) {
        if (next[i]?.[k] != null) {
          next[i][k] = null;
          changed = true;
        }

        continue;
      }

      const used = characterPlayUsageBeforePick(
        attacker,
        wrapPicks,
        next,
        i,
        k,
        damageMods,
        activeBaseCount,
      );

      const available = characterPlaysForAttacker(attacker).filter(
        (cp) => !used.has(cp.id),
      );

      if (available.length === 0) {
        continue;
      }

      const f = next[i][k];

      if (f == null || !available.some((cp) => cp.id === f)) {
        next[i][k] = available[0].id;
        changed = true;
      }
    }
  }

  return { characterPlayPicks: next, changed };
};
