/** Id of the section holding a swing's extra wrap slots. */
export const wrapSectionId = (attackIndex: number): string => {
  return `attack-wrap-${attackIndex}`;
};

/** Id of the toggle that opens and closes that section. */
export const wrapTriggerId = (attackIndex: number): string => {
  return `attack-wrap-trigger-${attackIndex}`;
};
