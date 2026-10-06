import { describe, expect, it } from 'vitest';
import { hpAfterDamage } from '@/core/damage/hpAfterDamage';

describe('hpAfterDamage', () => {
  it('subtracts the damage from the HP', () => {
    expect(hpAfterDamage(10, 3)).toBe(7);
  });

  it('reaches zero on exact lethal damage', () => {
    expect(hpAfterDamage(10, 10)).toBe(0);
  });

  it('never goes below zero on overkill', () => {
    expect(hpAfterDamage(10, 14)).toBe(0);
  });
});
