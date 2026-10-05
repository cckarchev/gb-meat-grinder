/** Repair character-play rows after the wrap picks or earlier plays changed. */

import { characterPlayAvailabilityForPick } from '@/core/characterPlays/characterPlayUsage';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Fix play slots that no longer match their pick, or that hold a Once Per Turn
 * play an earlier pick already used.
 */
export const sanitizeCharacterPlayPicks = (
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

  for (let attackIndex = 0; attackIndex < wrapPicks.length; attackIndex++) {
    const picks = wrapPicks[attackIndex];

    for (let slot = 0; slot < picks.length; slot++) {
      const pick = picks[slot];
      const usesPlay = pick != null && choiceUsesCharacterPlay(attacker, pick);

      if (!usesPlay) {
        if (next[attackIndex]?.[slot] != null) {
          next[attackIndex][slot] = null;
          changed = true;
        }

        continue;
      }

      const { available, depleted } = characterPlayAvailabilityForPick(
        attacker,
        wrapPicks,
        next,
        attackIndex,
        slot,
        damageMods,
        activeBaseCount,
      );

      if (depleted) {
        continue;
      }

      const current = next[attackIndex][slot];
      const currentIsAvailable = available.some((play) => play.id === current);

      if (current == null || !currentIsAvailable) {
        next[attackIndex][slot] = available[0].id;
        changed = true;
      }
    }
  }

  return { characterPlayPicks: next, changed };
};
