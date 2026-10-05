import type { ReactNode } from 'react';
import styled from 'styled-components';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';
import { focusRing } from '@/styles/mixins';

const InfoTipAnchor = styled.span`
  position: relative;
  display: inline;
`;

/** Inline text trigger, styled as plain text with a dotted underline hint. */
const Trigger = styled.button`
  font: inherit;
  color: inherit;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.12em;
  text-align: inherit;

  ${focusRing}

  &:focus-visible {
    border-radius: 0;
  }
`;

type InfoTipProps = {
  content: string;
  children: ReactNode;
};

/**
 * Accessible inline tooltip. The supplied text remains the visible, focusable
 * trigger; the description opens on hover, focus, or click/tap and dismisses on
 * blur, outside click, or Escape. Safe to nest inside a `<label>` because a
 * `<button>` is interactive content (clicking it does not toggle the control).
 */
export const InfoTip = ({ content, children }: InfoTipProps) => {
  const { open, tooltipId, toggle, wrapperProps, triggerProps } =
    useTooltipOpen<HTMLSpanElement>();

  return (
    <InfoTipAnchor {...wrapperProps}>
      <Trigger
        type="button"
        {...triggerProps}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          toggle();
        }}
      >
        {children}
      </Trigger>
      {open ? (
        <TooltipBubble $size="regular" id={tooltipId} role="tooltip">
          {content}
        </TooltipBubble>
      ) : null}
    </InfoTipAnchor>
  );
};
