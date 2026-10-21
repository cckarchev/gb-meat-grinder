import { describe, expect, it } from 'vitest';
import { hpAfterDamage } from '@/core/damage/hpAfterDamage';

const HP = 10;

describe('hpAfterDamage', () => {
  it('subtracts the damage from the HP', () => {
    const damage = 3;

    expect(hpAfterDamage(HP, damage)).toBe(HP - damage);
  });

  it('reaches zero on exact lethal damage', () => {
    expect(hpAfterDamage(HP, HP)).toBe(0);
  });

  it('never goes below zero on overkill', () => {
    const overkill = 14;

    expect(hpAfterDamage(HP, overkill)).toBe(0);
  });
});
