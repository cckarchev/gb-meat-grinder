import { describe, expect, it } from 'vitest';
import {
  cheapestChoiceId,
  maxPlaybookNet,
  playbookIndex,
} from '@/core/playbook/playbookIndex';
import { makeAttacker } from '@/core/testing/fixtures';

describe('playbookIndex', () => {
  it('indexes every result by id and records the widest column', () => {
    const index = playbookIndex(makeAttacker());

    expect([...index.byId.keys()].sort()).toEqual(
      ['dodge', 'four', 'gb', 'kd', 'one', 'push', 'two'].sort(),
    );

    expect(index.maxNet).toBe(4);
  });

  it('caches per attacker object', () => {
    const attacker = makeAttacker();

    expect(playbookIndex(attacker)).toBe(playbookIndex(attacker));
    expect(maxPlaybookNet(attacker)).toBe(4);
  });
});

describe('cheapestChoiceId', () => {
  it('returns the first line of the first playbook column', () => {
    expect(cheapestChoiceId(makeAttacker())).toBe('one');
  });
});
