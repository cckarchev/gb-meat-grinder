import { describe, expect, it } from 'vitest';
import { sanitizeCharacterPlayPicks } from '@/core/characterPlays/sanitizeCharacterPlayPicks';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('sanitizeCharacterPlayPicks', () => {
  const attacker = makeAttacker();

  it('sanitizes illegal and orphaned play picks', () => {
    const result = sanitizeCharacterPlayPicks(
      attacker,
      [['gb'], ['gb'], ['one']],
      [['playTac'], ['playTac'], ['playDef']],
      NO_MODS,
      3,
    );

    expect(result).toEqual({
      characterPlayPicks: [['playTac'], ['playDef'], [null]],
      changed: true,
    });
  });
});
