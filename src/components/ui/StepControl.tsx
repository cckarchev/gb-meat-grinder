import { useId } from 'react';
import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import { focusRing } from '@/styles/mixins';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 10rem;

  ${narrowViewport} {
    min-width: 7.25rem;
  }
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
  border-radius: var(--radius-sm);
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

  ${focusRing}

  ${narrowViewport} {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
`;

const ValueDisplay = styled.span`
  flex: 1;
  min-width: 5.5rem;
  text-align: center;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
  padding: 0.35rem 0.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);

  ${narrowViewport} {
    min-width: 4.25rem;
    font-size: 0.88rem;
    padding: 0.28rem 0.18rem;
  }
`;

/** How far one button press moves the value. */
const STEP = 1;

type StepControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** What the buttons change, for their labels: `armor` reads "Decrease armor". */
  ariaSubject: string;
  /** Shown inside the value box, e.g. `4+`. Defaults to the plain value. */
  valueLabel?: string;
};

export const StepControl = ({
  label,
  value,
  min,
  max,
  onChange,
  ariaSubject,
  valueLabel = String(value),
}: StepControlProps) => {
  const labelId = useId();
  const canDec = value > min;
  const canInc = value < max;

  return (
    <Wrap>
      <LabelText id={labelId}>{label}</LabelText>
      <ControlRow role="group" aria-labelledby={labelId}>
        <StepButton
          type="button"
          aria-label={`Decrease ${ariaSubject}`}
          disabled={!canDec}
          onClick={() => onChange(Math.max(min, value - STEP))}
        >
          -
        </StepButton>
        <ValueDisplay>{valueLabel}</ValueDisplay>
        <StepButton
          type="button"
          aria-label={`Increase ${ariaSubject}`}
          disabled={!canInc}
          onClick={() => onChange(Math.min(max, value + STEP))}
        >
          +
        </StepButton>
      </ControlRow>
    </Wrap>
  );
};
