import type { FocusEvent, MouseEvent, ReactNode } from 'react';
import styled from 'styled-components';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';
import { narrowViewport } from '@/styles/breakpoints';

const DISABLED_INPUT_OPACITY = 0.5;

/** Label row holding the checkbox and its tooltip-trigger text. */
const CheckOption = styled.label<{ $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.35rem;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.88rem;
  /* Dim the label text rather than the whole row, so a nested tooltip popover
     (which lives inside this label) stays fully legible when disabled. */
  color: ${({ $disabled }) => ($disabled ? 'var(--muted)' : 'var(--text)')};
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
    opacity: ${({ $disabled }) => ($disabled ? DISABLED_INPUT_OPACITY : 1)};
  }

  ${narrowViewport} {
    font-size: 0.82rem;
  }
`;

/** Plain label text (clicking it toggles the box), hinting at its tooltip. */
const LabelText = styled.span`
  position: relative;
  text-decoration: underline dotted;
  text-underline-offset: 0.12em;
`;

type TooltipCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip: string;
  disabled?: boolean;
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
    <CheckOption $disabled={disabled}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        {...triggerProps}
        onFocus={openOnKeyboardFocus}
      />
      <LabelText {...wrapperProps}>
        {children}
        {open ? (
          <TooltipBubble
            $size="regular"
            id={tooltipId}
            role="tooltip"
            onClick={ignoreBubbleClick}
          >
            {tooltip}
          </TooltipBubble>
        ) : null}
      </LabelText>
    </CheckOption>
  );
};
