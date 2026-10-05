import type { ReactNode } from 'react';
import styles from '@/components/ui/ui.module.css';

type SetupPanelsRowProps = {
  children: ReactNode;
};

/** Side-by-side row for the attacker and enemy panels, wrapping on narrow screens. */
export const SetupPanelsRow = ({ children }: SetupPanelsRowProps) => {
  return <div className={styles.setupPanelsRow}>{children}</div>;
};
