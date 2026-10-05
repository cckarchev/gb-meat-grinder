import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { focusRing } from '@/styles/mixins';

const Wrap = styled.span`
  position: relative;
  display: inline;
`;

/** Inline text trigger: keeps the look of the prior dotted-underline hint. */
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

/**
 * Accessible inline tooltip. The supplied text remains the visible, focusable
 * trigger; the description opens on hover, focus, or click/tap and dismisses on
 * blur, outside click, or Escape. Safe to nest inside a `<label>` because a
 * `<button>` is interactive content (clicking it does not toggle the control).
 */
export const InfoTip = ({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <Wrap
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Trigger
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        {children}
      </Trigger>
      {open ? (
        <TooltipBubble $size="regular" id={tooltipId} role="tooltip">
          {content}
        </TooltipBubble>
      ) : null}
    </Wrap>
  );
};
