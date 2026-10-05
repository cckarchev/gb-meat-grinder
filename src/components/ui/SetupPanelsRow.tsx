import type { ComponentProps } from 'react';
import styles from '@/components/ui/ui.module.css';
import { joinClassNames } from '@/styles/joinClassNames';

/** Side-by-side row for the attacker and enemy panels, wrapping on narrow screens. */
export const SetupPanelsRow = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      className={joinClassNames(styles.setupPanelsRow, className)}
      {...props}
    />
  );
};
