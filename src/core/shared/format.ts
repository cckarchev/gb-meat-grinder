/** Display formatting for numbers shown in the panels. */

/** A number with an explicit `+` when positive; zero stays unsigned. */
export const formatSigned = (value: number): string => {
  return value > 0 ? `+${value}` : `${value}`;
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
