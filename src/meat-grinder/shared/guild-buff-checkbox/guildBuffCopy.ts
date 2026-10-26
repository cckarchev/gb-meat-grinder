/**
 * Tooltip for a buff the model cannot receive because it is the source of it.
 */
export const tooltipExcludedBuff = (
  buffTooltip: string,
  modelName: string,
): string => `${buffTooltip} (not available to ${modelName})`;
