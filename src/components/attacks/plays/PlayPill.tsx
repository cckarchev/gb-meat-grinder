import { type ReactNode, useId, useState } from 'react';
import styled from 'styled-components';
import { ToggleButton } from '@/components/ui/controls';
import { narrowViewport } from '@/styles/breakpoints';

const PillWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

const SelectionBtn = styled(ToggleButton)<{ $muted?: boolean }>`
  min-width: 8.5rem;

  /* No-op plays (e.g. Snack Break) read as cosmetic via a dashed outline. */
  ${(p) => (p.$muted && !p.$active ? 'border-style: dashed;' : '')}

  ${narrowViewport} {
    min-width: 6.75rem;
  }
`;

/** Hover/focus tooltip describing a play's effect and cadence. */
const Bubble = styled.span`
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 20;
  width: max-content;
  max-width: min(16rem, 80vw);
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--popover-bg);
  color: var(--text);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-size: 0.74rem;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  text-align: left;
  letter-spacing: normal;
  text-transform: none;
`;

type PlayPillProps = {
  active: boolean;
  muted: boolean;
  description: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
};

/** A character-play toggle with a hover / focus effect tooltip. */
export const PlayPill = ({
  active,
  muted,
  description,
  ariaLabel,
  onClick,
  children,
}: PlayPillProps) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <PillWrap
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SelectionBtn
        type="button"
        $active={active}
        $muted={muted}
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={onClick}
      >
        {children}
      </SelectionBtn>
      {open ? (
        <Bubble id={tooltipId} role="tooltip">
          {description}
        </Bubble>
      ) : null}
    </PillWrap>
  );
};
