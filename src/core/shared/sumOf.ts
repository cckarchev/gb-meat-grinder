/** Sum of one optional number per item; a missing value counts as 0. */
export const sumOf = <T>(
  items: readonly T[],
  valueFor: (item: T) => number | undefined,
): number => {
  let sum = 0;

  for (const item of items) {
    sum += valueFor(item) ?? 0;
  }

  return sum;
};
