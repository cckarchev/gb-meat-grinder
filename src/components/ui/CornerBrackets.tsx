import type { CSSProperties } from 'react';

/** Stroke width of each bracket, in px. */
const BRACKET_THICKNESS = 2;

/** Offset from the parent's edges, in px: -1 sits the bracket over a 1px border. */
const BRACKET_INSET = -1;

type Corner = {
  key: string;
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
};

const CORNERS: readonly Corner[] = [
  { key: 'top-left', vertical: 'top', horizontal: 'left' },
  { key: 'top-right', vertical: 'top', horizontal: 'right' },
  { key: 'bottom-left', vertical: 'bottom', horizontal: 'left' },
  { key: 'bottom-right', vertical: 'bottom', horizontal: 'right' },
];

/** The border property that draws each side's arm of a bracket. */
const BORDER_SIDE = {
  top: 'borderTop',
  bottom: 'borderBottom',
  left: 'borderLeft',
  right: 'borderRight',
} as const;

type CornerBracketsProps = {
  /** Bracket color, as any CSS color value. */
  accent: string;
  size: number;
};

/**
 * Four L-shaped corner brackets framing an active/selected element. Renders
 * inside a `position: relative` parent and is purely decorative.
 */
export const CornerBrackets = ({ accent, size }: CornerBracketsProps) => {
  const line = `${BRACKET_THICKNESS}px solid ${accent}`;

  return (
    <>
      {CORNERS.map(({ key, vertical, horizontal }) => {
        const style: CSSProperties = {
          position: 'absolute',
          width: size,
          height: size,
          pointerEvents: 'none',
          [vertical]: BRACKET_INSET,
          [horizontal]: BRACKET_INSET,
          [BORDER_SIDE[vertical]]: line,
          [BORDER_SIDE[horizontal]]: line,
        };

        return <span key={key} aria-hidden="true" style={style} />;
      })}
    </>
  );
};
