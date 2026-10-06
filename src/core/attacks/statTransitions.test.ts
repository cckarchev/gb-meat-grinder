import { describe, expect, it } from 'vitest';
import { statTransitions } from '@/core/attacks/statTransitions';

describe('statTransitions', () => {
  it('pairs each swing value with the value of the swing before it', () => {
    expect(statTransitions([4, 3, 3])).toEqual([
      { from: undefined, to: 4 },
      { from: 4, to: 3 },
      { from: 3, to: 3 },
    ]);
  });

  it('pairs the first swing with the starting value when one is given', () => {
    expect(statTransitions([11, 8], 14)).toEqual([
      { from: 14, to: 11 },
      { from: 11, to: 8 },
    ]);
  });

  it('returns nothing for an activation without swings', () => {
    expect(statTransitions([], 14)).toEqual([]);
  });
});
