import type { ComponentProps } from 'react';
import styles from '@/components/ui/TooltipBubble.module.css';

type TooltipBubbleSize = 'compact' | 'regular';

type TooltipBubbleProps = Omit<ComponentProps<'span'>, 'className'> & {
  /** Picks the max width and font size. */
  size: TooltipBubbleSize;
};

/** Popover panel anchored below its `position: relative` parent. */
export const TooltipBubble = ({ size, ...props }: TooltipBubbleProps) => {
  return <span className={styles.tooltipBubble} data-size={size} {...props} />;
};
