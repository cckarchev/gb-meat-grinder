/** Before/after pairs for a per-swing stat, so the UI can show what each swing changed. */

export type StatTransition = {
  /** Value before this swing. */
  from: number;
  to: number;
};

/**
 * Pairs each swing's value with the previous swing's value. The first swing
 * pairs with `startingValue`.
 */
export const statTransitions = (
  values: readonly number[],
  startingValue: number,
): StatTransition[] => {
  return values.map((to, index) => {
    const isFirstSwing = index === 0;
    const from = isFirstSwing ? startingValue : values[index - 1];

    return { from, to };
  });
};
