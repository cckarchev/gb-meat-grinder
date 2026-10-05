import { describe, expect, it } from 'vitest';
import {
  coverSwingClockIndices,
  wrapPickClearsCover,
} from '@/core/playbook/coverClearing';
import { makeAttacker } from '@/core/testing/fixtures';

describe('cover clearing', () => {
  it('knows which picks clear cover', () => {
    const attacker = makeAttacker();

    expect(wrapPickClearsCover(attacker, 'push')).toBe(true);
    expect(wrapPickClearsCover(attacker, 'two')).toBe(false);
    expect(wrapPickClearsCover(attacker, null)).toBe(false);
  });

  it('keeps a fixed base then Berserker clock for cover', () => {
    const berserker = makeAttacker({ inf: 2, berserker: true });

    expect(coverSwingClockIndices(berserker, 2)).toEqual([0, 2, 1, 3]);
  });
});
