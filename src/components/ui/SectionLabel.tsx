import styled from 'styled-components';
import { ChevronMark } from '@/components/ui/ChevronMark';

interface SectionLabelProps {
  label: string;
  /** Optional prefix rendered as `number: label`. */
  number?: string;
  /** Color for both the chevron and the text. Defaults to the CCK accent. */
  color?: string;
  className?: string;
}

const Label = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: var(--tracking-label-wide);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
`;

/** Mono uppercase eyebrow with a leading chevron — the CCK section marker. */
export function SectionLabel({
  label,
  number,
  color = 'var(--accent)',
  className,
}: SectionLabelProps) {
  const text = number ? `${number}: ${label}` : label;
  return (
    <Label className={className} style={{ color }}>
      <ChevronMark color={color} size={13} />
      <span>{text}</span>
    </Label>
  );
}
