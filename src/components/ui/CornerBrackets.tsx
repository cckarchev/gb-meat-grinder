import type { CSSProperties } from 'react';

interface CornerBracketsProps {
  /** Bracket color, as any CSS color value. */
  accent: string;
  size: number;
  thickness?: number;
  inset?: number;
}

/**
 * Four L-shaped corner brackets framing an active/selected element. Renders
 * inside a `position: relative` parent and is purely decorative.
 */
export const CornerBrackets = ({
  accent,
  size,
  thickness = 2,
  inset = -1,
}: CornerBracketsProps) => {
  const base: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
  };

  const line = `${thickness}px solid ${accent}`;

  return (
    <>
      <span
        aria-hidden="true"
        style={{
          ...base,
          top: inset,
          left: inset,
          borderTop: line,
          borderLeft: line,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          ...base,
          top: inset,
          right: inset,
          borderTop: line,
          borderRight: line,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          ...base,
          bottom: inset,
          left: inset,
          borderBottom: line,
          borderLeft: line,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          ...base,
          bottom: inset,
          right: inset,
          borderBottom: line,
          borderRight: line,
        }}
      />
    </>
  );
};
