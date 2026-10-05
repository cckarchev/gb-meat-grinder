/** Display labels for playbook lines and wrap rows. */

import { effectiveDamageForChoice } from '@/core/damage';
import { getPlaybookResult } from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

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
  const r = getPlaybookResult(attacker, id);
  const dodge = r.dodge ? '<' : '';

  if (r.picksCharacterPlay && r.damage > 0) {
    return `${effectiveDamageForChoice(attacker, id, mods)}GB${dodge}`;
  }

  if (r.damage > 0 && r.label === String(r.damage)) {
    return `${effectiveDamageForChoice(attacker, id, mods)}${dodge}`;
  }

  return r.label + dodge;
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

  return labels.length > 0 ? labels.join(' → ') : '-';
};
