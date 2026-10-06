import { describe, expect, it, vi } from 'vitest';
import {
  ATTACKERS,
  attackerById,
  DEFAULT_ATTACKER,
  findAttackerById,
  randomAttacker,
} from '@/data/attackers/registry';

describe('attackerById', () => {
  it('finds every registered model', () => {
    for (const attacker of ATTACKERS) {
      expect(attackerById(attacker.id)).toBe(attacker);
    }
  });

  it('falls back to the default model for an unknown id', () => {
    expect(attackerById('nobody')).toBe(DEFAULT_ATTACKER);
  });
});

describe('findAttackerById', () => {
  it('finds every registered model', () => {
    for (const attacker of ATTACKERS) {
      expect(findAttackerById(attacker.id)).toBe(attacker);
    }
  });

  it('finds nothing for an unknown or missing id', () => {
    expect(findAttackerById('nobody')).toBeUndefined();
    expect(findAttackerById(null)).toBeUndefined();
  });
});

describe('randomAttacker', () => {
  it('maps Math.random across the whole registry', () => {
    const lastIndex = ATTACKERS.length - 1;
    const justBelowOne = 0.999;

    vi.spyOn(Math, 'random').mockReturnValueOnce(0);
    expect(randomAttacker()).toBe(ATTACKERS[0]);

    vi.spyOn(Math, 'random').mockReturnValueOnce(justBelowOne);
    expect(randomAttacker()).toBe(ATTACKERS[lastIndex]);
  });
});
