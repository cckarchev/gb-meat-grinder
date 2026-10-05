import type { ReactNode } from 'react';
import styles from '@/components/attacks/plays/PlayPill.module.css';
import { ToggleButton } from '@/components/ui/controls';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { useTooltipOpen } from '@/components/ui/useTooltipOpen';
import { dataFlag } from '@/styles/dataFlag';

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
    <span className={styles.anchor} {...wrapperProps}>
      <ToggleButton
        className={styles.playToggleButton}
        type="button"
        active={active}
        data-muted={dataFlag(muted)}
        aria-label={ariaLabel}
        {...triggerProps}
        onClick={onClick}
      >
        {children}
      </ToggleButton>
      {open ? (
        <TooltipBubble size="compact" id={tooltipId} role="tooltip">
          {description}
        </TooltipBubble>
      ) : null}
    </span>
  );
};
