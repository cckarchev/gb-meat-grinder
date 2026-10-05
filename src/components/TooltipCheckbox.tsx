import type { ReactNode } from 'react';
import { InfoTip } from '@/components/InfoTip';
import { CheckOption } from '@/components/targetPanelPrimitives';

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
        onChange={(e) => onChange(e.target.checked)}
      />
      <InfoTip content={tooltip}>{children}</InfoTip>
    </CheckOption>
  );
};
