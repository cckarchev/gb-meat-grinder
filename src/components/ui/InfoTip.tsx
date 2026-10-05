import type { ReactNode } from 'react';
import styles from '@/components/ui/InfoTip.module.css';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';

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
    <span className={styles.anchor} {...wrapperProps}>
      <button
        className={styles.trigger}
        type="button"
        {...triggerProps}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          toggle();
        }}
      >
        {children}
      </button>
      {open ? (
        <TooltipBubble size="regular" id={tooltipId} role="tooltip">
          {content}
        </TooltipBubble>
      ) : null}
    </span>
  );
};
