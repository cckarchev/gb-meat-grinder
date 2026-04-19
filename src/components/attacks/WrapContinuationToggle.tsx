import styled from 'styled-components';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';

const WrapToggleButton = styled.button`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0;
  padding: 0.28rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    background: color-mix(in srgb, var(--input-bg) 88%, var(--text));
    border-color: var(--muted);
  }

  &:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }

  ${narrowViewport} {
    padding: 0.24rem 0.38rem;
    font-size: 0.68rem;
    gap: 0.22rem;
  }

  ${extraNarrowViewport} {
    padding: 0.2rem 0.32rem;
    font-size: 0.62rem;
    gap: 0.18rem;
    border-radius: 5px;
  }
`;

const ChevronCaret = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.55rem;
  line-height: 1;
  color: var(--muted);
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? 0 : -90)}deg);

  &::before {
    content: '▼';
  }

  ${extraNarrowViewport} {
    font-size: 0.48rem;
  }
`;

/** Opens / closes extra wrap slots (shown next to TAC in the dice pool strip). */
export function WrapContinuationToggle({
  attackIndex,
  wrapOpen,
  onClick,
}: {
  attackIndex: number;
  wrapOpen: boolean;
  onClick: () => void;
}) {
  return (
    <WrapToggleButton
      type="button"
      id={`attack-wrap-trigger-${attackIndex}`}
      aria-expanded={wrapOpen}
      aria-controls={`attack-wrap-${attackIndex}`}
      title={
        wrapOpen
          ? 'Close additional wrap and clear extra picks'
          : 'Open additional wrap'
      }
      onClick={onClick}
    >
      <span>{wrapOpen ? 'Close' : 'Wrap'}</span>
      <ChevronCaret $open={wrapOpen} aria-hidden />
    </WrapToggleButton>
  );
}
