import { describe, expect, it } from 'vitest';
import { damageQuantile } from '@/core/damage/damageDistribution';

describe('damageQuantile', () => {
  const distribution = new Map([
    [0, 0.25],
    [2, 0.5],
    [5, 0.25],
  ]);

  it('returns the smallest damage whose cumulative probability reaches q', () => {
    expect(damageQuantile(distribution, 0.1)).toBe(0);
    expect(damageQuantile(distribution, 0.5)).toBe(2);
    expect(damageQuantile(distribution, 0.76)).toBe(5);
    expect(damageQuantile(distribution, 1)).toBe(5);
  });

  it('returns the largest damage when q exceeds the total mass', () => {
    const partial = new Map([
      [1, 0.4],
      [3, 0.5],
    ]);

    expect(damageQuantile(partial, 0.95)).toBe(3);
  });

  it('is 0 for an empty distribution', () => {
    expect(damageQuantile(new Map(), 0.5)).toBe(0);
  });
});
