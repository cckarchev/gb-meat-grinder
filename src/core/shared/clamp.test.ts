import { describe, expect, it } from 'vitest';
import { clamp, clampToRange } from '@/core/shared/clamp';

const MAX = 5;
const INSIDE = 3;
const ABOVE = 9;

describe('clamp', () => {
  it('keeps a value already inside the range', () => {
    expect(clamp(INSIDE, 0, MAX)).toBe(INSIDE);
  });

  it('raises a value below the range to the minimum', () => {
    expect(clamp(-2, 0, MAX)).toBe(0);
  });

  it('lowers a value above the range to the maximum', () => {
    expect(clamp(ABOVE, 0, MAX)).toBe(MAX);
  });

  it('favors the minimum when the range is inverted', () => {
    expect(clamp(2, 0, -1)).toBe(0);
  });
});

describe('clampToRange', () => {
  const range = { min: 0, max: MAX };

  it('keeps a value already inside the range', () => {
    expect(clampToRange(INSIDE, range)).toBe(INSIDE);
  });

  it('limits a value to the range bounds', () => {
    expect(clampToRange(-2, range)).toBe(0);
    expect(clampToRange(ABOVE, range)).toBe(MAX);
  });
});
