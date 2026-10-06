import { describe, expect, it } from 'vitest';
import { statTransitions } from '@/core/attacks/statTransitions';

describe('statTransitions', () => {
  it('pairs each swing with the one before it, the first with the starting value', () => {
    expect(statTransitions([11, 8, 8], 14)).toEqual([
      { from: 14, to: 11 },
      { from: 11, to: 8 },
      { from: 8, to: 8 },
    ]);
  });

  it('returns nothing for an activation without swings', () => {
    expect(statTransitions([], 14)).toEqual([]);
  });
});
