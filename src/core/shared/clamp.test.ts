import { describe, expect, it } from 'vitest';
import { clamp, clampToRange } from '@/core/shared/clamp';

describe('clamp', () => {
  it('keeps a value already inside the range', () => {
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it('raises a value below the range to the minimum', () => {
    expect(clamp(-2, 0, 5)).toBe(0);
  });

  it('lowers a value above the range to the maximum', () => {
    expect(clamp(9, 0, 5)).toBe(5);
  });

  it('favors the minimum when the range is inverted', () => {
    expect(clamp(2, 0, -1)).toBe(0);
  });
});

describe('clampToRange', () => {
  const range = { min: 0, max: 5 };

  it('keeps a value already inside the range', () => {
    expect(clampToRange(3, range)).toBe(3);
  });

  it('limits a value to the range bounds', () => {
    expect(clampToRange(-2, range)).toBe(0);
    expect(clampToRange(9, range)).toBe(5);
  });
});
