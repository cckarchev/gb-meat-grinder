import type { ReactNode } from 'react';
import styled from 'styled-components';
import { ToggleButton } from '@/components/ui/controls';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';
import { narrowViewport } from '@/styles/breakpoints';

const PillWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

const PlayToggleButton = styled(ToggleButton)<{ $muted: boolean }>`
  min-width: 8.5rem;

  /* No-op plays (e.g. Snack Break) read as cosmetic via a dashed outline. */
  ${(props) => (props.$muted && !props.$active ? 'border-style: dashed;' : '')}

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
  const { open, tooltipId, wrapperProps, triggerProps } =
    useTooltipOpen<HTMLSpanElement>();

  return (
    <PillWrap {...wrapperProps}>
      <PlayToggleButton
        type="button"
        $active={active}
        $muted={muted}
        aria-label={ariaLabel}
        {...triggerProps}
        onClick={onClick}
      >
        {children}
      </PlayToggleButton>
      {open ? (
        <TooltipBubble $size="compact" id={tooltipId} role="tooltip">
          {description}
        </TooltipBubble>
      ) : null}
    </PillWrap>
  );
};
