/** Display formatting for numbers shown in the panels. */

/** Below this (but above 0), percentages render as a floor instead of 0.0%. */
const TINY_PROBABILITY = 0.0001;
const TINY_PROBABILITY_LABEL = '<0.01%';
const PERCENT = 100;

/** Shown in place of a value that is missing or cannot be computed. */
export const EMPTY_VALUE_LABEL = '-';

/** A number with an explicit `+` when positive; zero stays unsigned. */
export const formatSigned = (value: number): string => {
  return value > 0 ? `+${value}` : `${value}`;
};

/** A probability as a percentage; tiny values show a floor, non-finite ones a dash. */
export const formatPercent = (probability: number, digits = 1): string => {
  if (!Number.isFinite(probability)) {
    return EMPTY_VALUE_LABEL;
  }

  if (probability < TINY_PROBABILITY && probability > 0) {
    return TINY_PROBABILITY_LABEL;
  }

  return `${(PERCENT * probability).toFixed(digits)}%`;
};

/** A `low-high` range, or the single value when both bounds match. */
export const formatRange = ({
  low,
  high,
}: {
  low: number;
  high: number;
}): string => {
  return low === high ? `${low}` : `${low}-${high}`;
};

/** Display indexes are 0-based; attacks are numbered from 1 for players. */
const FIRST_ATTACK_ORDINAL = 1;

/** The 1-based number an attack is shown with. */
export const attackOrdinal = (displayIndex: number): number => {
  return displayIndex + FIRST_ATTACK_ORDINAL;
};
