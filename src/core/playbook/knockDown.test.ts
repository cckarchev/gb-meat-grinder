import { describe, expect, it } from 'vitest';
import { kdAlreadyTakenBeforePick } from '@/core/playbook/knockDown';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('kdAlreadyTakenBeforePick', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['kd']];

  it('allows only the first KD in the activation', () => {
    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2),
    ).toBe(false);

    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(true);

    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2, true),
    ).toBe(true);
  });
});
