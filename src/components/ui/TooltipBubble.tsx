import type { ComponentProps } from 'react';
import styles from '@/components/ui/TooltipBubble.module.css';
import { joinClassNames } from '@/styles/joinClassNames';

type TooltipBubbleSize = 'compact' | 'regular';

type TooltipBubbleProps = ComponentProps<'span'> & {
  /** Picks the offset, width, padding, and font size set. */
  size: TooltipBubbleSize;
};

/** Popover panel anchored below its `position: relative` parent. */
export const TooltipBubble = ({
  size,
  className,
  ...props
}: TooltipBubbleProps) => {
  return (
    <span
      className={joinClassNames(styles.tooltipBubble, className)}
      data-size={size}
      {...props}
    />
  );
};
