interface ChevronMarkProps {
  /** Stroke color. Defaults to the CCK brand teal. */
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** The CCK `›` chevron mark, rendered as an inline SVG. Decorative. */
export function ChevronMark({
  color = 'var(--teal-bright)',
  size = 14,
  strokeWidth = 2.4,
  className,
}: ChevronMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <path
        d="M3 2 L9 8 L3 14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />
    </svg>
  );
}
