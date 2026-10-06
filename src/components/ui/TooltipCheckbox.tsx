import type { FocusEvent, MouseEvent, ReactNode } from 'react';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import styles from '@/components/ui/TooltipCheckbox.module.css';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';
import { dataFlag } from '@/styles/dataFlag';
import { joinClassNames } from '@/styles/joinClassNames';

type TooltipCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip: string;
  disabled?: boolean;
  /** Extra class for the row, to fit it into another layout (e.g. an inline strip). */
  className?: string;
  children: ReactNode;
};

/**
 * Checkbox row whose label explains itself in a tooltip. The whole label
 * toggles the box; the tooltip opens on hover, or on keyboard focus of the box.
 */
export const TooltipCheckbox = ({
  checked,
  onChange,
  tooltip,
  disabled = false,
  className,
  children,
}: TooltipCheckboxProps) => {
  const { open, tooltipId, wrapperProps, triggerProps } =
    useTooltipOpen<HTMLSpanElement>();

  // A mouse click focuses the box too; only keyboard focus should pin it open.
  const openOnKeyboardFocus = (event: FocusEvent<HTMLInputElement>) => {
    const keyboardFocus = event.currentTarget.matches(':focus-visible');

    if (keyboardFocus) {
      triggerProps.onFocus();
    }
  };

  // Clicks on the popover text should not toggle the box behind it.
  const ignoreBubbleClick = (event: MouseEvent) => {
    event.preventDefault();
  };

  return (
    <label
      className={joinClassNames(styles.checkOption, className)}
      data-disabled={dataFlag(disabled)}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        {...triggerProps}
        onFocus={openOnKeyboardFocus}
      />
      <span className={styles.labelText} {...wrapperProps}>
        {children}
        {open ? (
          <TooltipBubble
            size="regular"
            id={tooltipId}
            role="tooltip"
            onClick={ignoreBubbleClick}
          >
            {tooltip}
          </TooltipBubble>
        ) : null}
      </span>
    </label>
  );
};
