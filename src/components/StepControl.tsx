import { useId } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 10rem;
`;

const LabelText = styled.span`
  font-size: 0.8rem;
  color: var(--muted);
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const StepButton = styled.button`
  font: inherit;
  font-size: 1.1rem;
  line-height: 1;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--panel);
    border-color: var(--muted);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }
`;

const ValueDisplay = styled.span`
  flex: 1;
  min-width: 5.5rem;
  text-align: center;
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
  padding: 0.35rem 0.25rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
`;

const Hint = styled.span`
  font-size: 0.72rem;
  color: var(--muted);
`;

export type StepControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Shown inside the value box, e.g. `4+` or `2` */
  valueLabel: string;
  hint?: string;
  decrementAriaLabel: string;
  incrementAriaLabel: string;
};

export function StepControl({
  label,
  value,
  min,
  max,
  onChange,
  valueLabel,
  hint,
  decrementAriaLabel,
  incrementAriaLabel,
}: StepControlProps) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const hintId = `${uid}-hint`;
  const canDec = value > min;
  const canInc = value < max;

  return (
    <Wrap>
      <LabelText id={labelId}>{label}</LabelText>
      <ControlRow
        role="group"
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
      >
        <StepButton
          type="button"
          aria-label={decrementAriaLabel}
          disabled={!canDec}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          -
        </StepButton>
        <ValueDisplay>{valueLabel}</ValueDisplay>
        <StepButton
          type="button"
          aria-label={incrementAriaLabel}
          disabled={!canInc}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </StepButton>
      </ControlRow>
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
    </Wrap>
  );
}
