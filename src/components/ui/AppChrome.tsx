import type { ComponentProps } from 'react';
import styles from '@/components/ui/AppChrome.module.css';
import { joinClassNames } from '@/styles/joinClassNames';

/** Centered, width-capped page shell around the whole app. */
export const AppChrome = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div className={joinClassNames(styles.appChrome, className)} {...props} />
  );
};
