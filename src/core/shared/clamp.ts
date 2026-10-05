/** Limit `value` to `[min, max]`; the minimum wins if the range is inverted. */
export const clamp = (value: number, min: number, max: number): number => {
  const capped = Math.min(max, value);

  return Math.max(min, capped);
};
