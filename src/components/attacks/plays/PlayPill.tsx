import { type ReactNode, useId, useState } from 'react';
import styled from 'styled-components';
import { ToggleButton } from '@/components/ui/controls';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
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
        <TooltipBubble $size="compact" id={tooltipId} role="tooltip">
          {description}
        </TooltipBubble>
      ) : null}
    </PillWrap>
  );
};
