import { useId } from 'react';
import styled from 'styled-components';
import type { StepControlProps } from '@/components/ui/stepControl.types';
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

export const StepControl = ({
  label,
  value,
  min,
  max,
  onChange,
  valueLabel,
  decrementAriaLabel,
  incrementAriaLabel,
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
    </Wrap>
  );
};
