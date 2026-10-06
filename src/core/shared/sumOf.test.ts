import { describe, expect, it } from 'vitest';
import { sumOf } from '@/core/shared/sumOf';

type Bonus = { amount?: number };

const amountOf = (bonus: Bonus): number | undefined => {
  return bonus.amount;
};

describe('sumOf', () => {
  it('adds the value of every item', () => {
    expect(sumOf([{ amount: 2 }, { amount: 3 }], amountOf)).toBe(5);
  });

  it('counts a missing value as 0', () => {
    expect(sumOf([{ amount: 2 }, {}], amountOf)).toBe(2);
  });

  it('is 0 for no items', () => {
    expect(sumOf([], amountOf)).toBe(0);
  });
});
