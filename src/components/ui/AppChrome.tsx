import type { ReactNode } from 'react';
import styles from '@/components/ui/AppChrome.module.css';

type AppChromeProps = {
  children: ReactNode;
};

/** Centered, width-capped page shell around the whole app. */
export const AppChrome = ({ children }: AppChromeProps) => {
  return <div className={styles.appChrome}>{children}</div>;
};
