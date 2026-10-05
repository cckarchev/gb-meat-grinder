import { describe, expect, it } from 'vitest';
import {
  formatWrapRowSelectionLabel,
  playbookLineDisplayLabel,
  playbookLineDisplaySegments,
} from '@/core/playbook/playbookLabels';
import { makeAttacker, modsWith, NO_MODS } from '@/core/testing/fixtures';

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('labels', () => {
  const attacker = makeAttacker();

  it('shows effective damage on numeric and GB lines', () => {
    expect(playbookLineDisplayLabel(attacker, 'two', TOUGH_HIDE)).toBe('1');

    expect(
      playbookLineDisplayLabel(
        attacker,
        'gb',
        modsWith({ buffs: { sharp: true } }),
      ),
    ).toBe('2GB');

    expect(playbookLineDisplayLabel(attacker, 'kd', NO_MODS)).toBe('KD<');
    expect(playbookLineDisplayLabel(attacker, 'push', NO_MODS)).toBe('>');
  });

  it('splits labels into stackable segments', () => {
    expect(playbookLineDisplaySegments(attacker, 'gb', NO_MODS)).toEqual([
      '1',
      'GB',
    ]);

    expect(playbookLineDisplaySegments(attacker, 'kd', NO_MODS)).toEqual([
      'KD',
      '<',
    ]);

    expect(playbookLineDisplaySegments(attacker, 'push', NO_MODS)).toEqual([
      '>',
    ]);
  });

  it('joins the picks of a row for summaries', () => {
    expect(
      formatWrapRowSelectionLabel(attacker, ['push', null, 'two'], NO_MODS),
    ).toBe('> → 2');

    expect(formatWrapRowSelectionLabel(attacker, [null], NO_MODS)).toBe('-');
  });
});
