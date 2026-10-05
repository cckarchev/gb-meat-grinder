/** Repair character-play rows after the wrap picks or earlier plays changed. */

import {
  characterPlayUsageBeforePick,
  unusedCharacterPlays,
} from '@/core/characterPlays/characterPlayUsage';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/wrapSlots';
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

      const used = characterPlayUsageBeforePick(
        attacker,
        wrapPicks,
        next,
        attackIndex,
        slot,
        damageMods,
        activeBaseCount,
      );

      const available = unusedCharacterPlays(attacker, used);

      if (available.length === 0) {
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
