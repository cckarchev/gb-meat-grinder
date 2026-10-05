/** Joins CSS class names into one `className`, skipping missing or empty ones. */
export const joinClassNames = (
  ...classNames: Array<string | undefined>
): string => {
  const presentClassNames = classNames.filter(Boolean);

  return presentClassNames.join(' ');
};
