import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';
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

const Bubble = styled.span`
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  z-index: 20;
  width: max-content;
  max-width: min(18rem, 80vw);
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--panel);
  color: var(--text);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  text-align: left;
  letter-spacing: normal;
  text-transform: none;
`;

/**
 * Accessible inline tooltip. The supplied text remains the visible, focusable
 * trigger; the description opens on hover, focus, or click/tap and dismisses on
 * blur, outside click, or Escape. Safe to nest inside a `<label>` because a
 * `<button>` is interactive content (clicking it does not toggle the control).
 */
export function InfoTip({
  content,
  children,
  className,
}: {
  content: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <Wrap
      ref={wrapRef}
      className={className}
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
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        {children}
      </Trigger>
      {open ? (
        <Bubble id={tooltipId} role="tooltip">
          {content}
        </Bubble>
      ) : null}
    </Wrap>
  );
}
