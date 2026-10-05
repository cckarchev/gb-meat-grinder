import type { StatRange } from '@/data/attackers/attacker.types';

/** Limit `value` to `[min, max]`; the minimum wins if the range is inverted. */
export const clamp = (value: number, min: number, max: number): number => {
  const capped = Math.min(max, value);

  return Math.max(min, capped);
};

/** Limit `value` to the bounds of `range`. */
export const clampToRange = (value: number, range: StatRange): number => {
  return clamp(value, range.min, range.max);
};
