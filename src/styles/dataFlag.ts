/**
 * Value for a boolean `data-*` attribute. React drops an `undefined` attribute,
 * so a CSS `[data-name]` selector matches only while the flag is on.
 */
export const dataFlag = (on: boolean): '' | undefined => {
  if (!on) {
    return undefined;
  }

  return '';
};
