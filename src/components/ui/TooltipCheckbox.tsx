import type { ReactNode } from 'react';
import styled from 'styled-components';
import { InfoTip } from '@/components/ui/InfoTip';
import { narrowViewport } from '@/styles/breakpoints';

const DISABLED_INPUT_OPACITY = 0.5;

/** Label row holding the checkbox and its tooltip-trigger text. */
const CheckOption = styled.label<{ $disabled?: boolean }>`
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

type TooltipCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip: string;
  disabled?: boolean;
  children: ReactNode;
};

/** Checkbox row whose label explains itself in a tooltip. */
export const TooltipCheckbox = ({
  checked,
  onChange,
  tooltip,
  disabled = false,
  children,
}: TooltipCheckboxProps) => {
  return (
    <CheckOption $disabled={disabled}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <InfoTip content={tooltip}>{children}</InfoTip>
    </CheckOption>
  );
};
