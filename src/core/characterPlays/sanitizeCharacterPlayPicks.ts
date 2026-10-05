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
      const pick = wrapPicks[i][k];
      const usesPlay = pick != null && choiceUsesCharacterPlay(attacker, pick);

      if (!usesPlay) {
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

      const available = unusedCharacterPlays(attacker, used);

      if (available.length === 0) {
        continue;
      }

      const current = next[i][k];
      const currentIsAvailable = available.some((cp) => cp.id === current);

      if (current == null || !currentIsAvailable) {
        next[i][k] = available[0].id;
        changed = true;
      }
    }
  }

  return { characterPlayPicks: next, changed };
};
