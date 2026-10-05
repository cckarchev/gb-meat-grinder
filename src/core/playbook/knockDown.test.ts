import { describe, expect, it } from 'vitest';
import { knockDownTakenBeforePick } from '@/core/playbook/knockDown';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('knockDownTakenBeforePick', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['kd']];

  it('allows only the first KD in the activation', () => {
    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2),
    ).toBe(false);

    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(true);

    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2, true),
    ).toBe(true);
  });
});
