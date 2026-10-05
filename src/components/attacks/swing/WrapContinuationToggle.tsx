import styled from 'styled-components';
import {
  LABEL_WRAP_CLOSE,
  LABEL_WRAP_OPEN,
  TITLE_WRAP_CLOSE,
  TITLE_WRAP_OPEN,
} from '@/components/attacks/swing/wrapToggleCopy';
import { wrapSectionId, wrapTriggerId } from '@/components/attacks/wrapIds';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import { inputButton } from '@/styles/mixins';

const WrapToggleButton = styled.button`
  ${inputButton}
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0;
  padding: 0.28rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  ${narrowViewport} {
    padding: 0.24rem 0.38rem;
    font-size: 0.68rem;
    gap: 0.22rem;
  }

  ${extraNarrowViewport} {
    padding: 0.2rem 0.32rem;
    font-size: 0.62rem;
    gap: 0.18rem;
    border-radius: var(--radius-xs);
  }
`;

const CARET_CLOSED_ROTATION_DEG = -90;

const ChevronCaret = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.55rem;
  line-height: 1;
  color: var(--muted);
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? 0 : CARET_CLOSED_ROTATION_DEG)}deg);

  &::before {
    content: '▼';
  }

  ${extraNarrowViewport} {
    font-size: 0.48rem;
  }
`;

type WrapContinuationToggleProps = {
  attackIndex: number;
  wrapOpen: boolean;
  onClick: () => void;
};

/** Opens / closes extra wrap slots (shown beside the pool readout in the dice pool strip). */
export const WrapContinuationToggle = ({
  attackIndex,
  wrapOpen,
  onClick,
}: WrapContinuationToggleProps) => {
  return (
    <WrapToggleButton
      type="button"
      id={wrapTriggerId(attackIndex)}
      aria-expanded={wrapOpen}
      aria-controls={wrapSectionId(attackIndex)}
      title={wrapOpen ? TITLE_WRAP_CLOSE : TITLE_WRAP_OPEN}
      onClick={onClick}
    >
      <span>{wrapOpen ? LABEL_WRAP_CLOSE : LABEL_WRAP_OPEN}</span>
      <ChevronCaret $open={wrapOpen} aria-hidden />
    </WrapToggleButton>
  );
};
