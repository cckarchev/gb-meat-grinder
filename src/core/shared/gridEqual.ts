/** Same length and the same values, compared by identity, in the same order. */
export const rowEqual = <T>(a: readonly T[], b: readonly T[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
};

/** Same row count and every row `rowEqual` to its counterpart. */
export const gridEqual = <T>(
  a: readonly (readonly T[])[],
  b: readonly (readonly T[])[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((row, index) => rowEqual(row, b[index]));
};
