import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import { PLAYBOOK_COLUMN_TRACK } from './playbookLayout';

const VerticalWrapToggle = styled.button`
  align-self: stretch;
  flex-shrink: 0;
  box-sizing: border-box;
  width: ${PLAYBOOK_COLUMN_TRACK};
  min-height: 4.5rem;
  margin: 0;
  padding: 0.4rem 0.15rem 0.35rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
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
    width: min(${PLAYBOOK_COLUMN_TRACK}, 100%);
    min-height: 3.85rem;
    padding: 0.28rem 0.08rem 0.22rem;
    gap: 0.15rem;
    border-radius: 6px;
  }
`;

const VerticalWrapLabelWrap = styled.span`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  width: 100%;
`;

const VerticalWrapLabel = styled.span`
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.06em;

  ${narrowViewport} {
    font-size: 0.68rem;
    letter-spacing: 0.04em;
  }
`;

const ChevronCaret = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.62rem;
  line-height: 1;
  color: var(--muted);
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? 0 : -90)}deg);

  &::before {
    content: '▼';
  }
`;

const VerticalWrapChevron = styled(ChevronCaret)`
  margin-top: auto;
`;

export function VerticalWrapStrip({
  attackIndex,
  wrapOpen,
  onClick,
}: {
  attackIndex: number;
  wrapOpen: boolean;
  onClick: () => void;
}) {
  return (
    <VerticalWrapToggle
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
      <VerticalWrapLabelWrap>
        <VerticalWrapLabel>{wrapOpen ? 'Close' : 'Wrap'}</VerticalWrapLabel>
      </VerticalWrapLabelWrap>
      <VerticalWrapChevron $open={wrapOpen} aria-hidden />
    </VerticalWrapToggle>
  );
}
