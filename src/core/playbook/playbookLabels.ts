/** Display labels for playbook lines and wrap rows. */

import { effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/wrapSlots';
import { EMPTY_VALUE_LABEL } from '@/core/shared/format';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Playbook button text: plain numeric pips (label matches damage) show the
 * **effective** value; a character-play line whose label ends in “GB” shows the
 * effective damage prefix (e.g. **0GB**, **1GB**) when it also deals damage.
 */
export const playbookLineDisplayLabel = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string => {
  const result = getPlaybookResult(attacker, id);
  const dodge = result.dodge ? '<' : '';

  if (result.picksCharacterPlay && result.damage > 0) {
    return `${effectiveDamageForChoice(attacker, id, mods)}GB${dodge}`;
  }

  if (result.damage > 0 && result.label === String(result.damage)) {
    return `${effectiveDamageForChoice(attacker, id, mods)}${dodge}`;
  }

  return result.label + dodge;
};

/**
 * {@link playbookLineDisplayLabel} split into stackable rows so a multi-effect
 * line can render one effect per line in the playbook circle (e.g. `3GB` →
 * `3` / `GB`, `KD<` → `KD` / `<`). Single-effect lines return one segment.
 */
export const playbookLineDisplaySegments = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): string[] => {
  const label = playbookLineDisplayLabel(attacker, id, mods);

  return label.match(/\d+|<|[A-Za-z]+/g) ?? [label];
};

/** Selected playbook lines on one attack row, for summaries (e.g. `> → 2 → GB`). */
export const formatWrapRowSelectionLabel = (
  attacker: AttackerData,
  picks: readonly WrapPick[],
  damageMods: PlaybookDamageMods,
): string => {
  const labels: string[] = [];

  for (const id of picks) {
    if (id == null) {
      continue;
    }

    labels.push(playbookLineDisplayLabel(attacker, id, damageMods));
  }

  return labels.length > 0 ? labels.join(' → ') : EMPTY_VALUE_LABEL;
};
