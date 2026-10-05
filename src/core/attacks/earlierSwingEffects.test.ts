import { describe, expect, it } from 'vitest';
import { coverTacPenaltyForAttack } from '@/core/attacks/earlierSwingEffects';
import { makeAttacker } from '@/core/testing/fixtures';

const COVER = true;

describe('coverTacPenaltyForAttack', () => {
  const attacker = makeAttacker();

  it('costs 1 die until an earlier swing pushes', () => {
    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 0, 2),
    ).toBe(1);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 1, 2),
    ).toBe(0);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['one'], ['push']], 1, 2),
    ).toBe(1);
  });

  it('is 0 without cover', () => {
    expect(
      coverTacPenaltyForAttack(attacker, !COVER, [['one'], ['one']], 1, 2),
    ).toBe(0);
  });
});

describe('rows outside the activation', () => {
  const attacker = makeAttacker();

  it('get the full cover penalty', () => {
    expect(coverTacPenaltyForAttack(attacker, COVER, [['push']], 5, 1)).toBe(1);
  });
});
