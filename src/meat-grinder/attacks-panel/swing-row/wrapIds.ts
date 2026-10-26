/** Id of the section holding a swing's extra wrap slots. */
export const wrapSectionId = (attackIndex: number): string =>
  `attack-wrap-${attackIndex}`;

/** Id of the toggle that opens and closes that section. */
export const wrapTriggerId = (attackIndex: number): string =>
  `attack-wrap-trigger-${attackIndex}`;
