import type { ComponentProps, ReactNode } from 'react';
import styles from '@/components/ui/ui.module.css';
import { joinClassNames } from '@/styles/joinClassNames';

export const Panel = ({ className, ...props }: ComponentProps<'section'>) => {
  return (
    <section className={joinClassNames(styles.panel, className)} {...props} />
  );
};

export const PanelFooterSection = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      className={joinClassNames(styles.panelFooterSection, className)}
      {...props}
    />
  );
};

export const PanelTitle = ({ className, ...props }: ComponentProps<'h2'>) => {
  return (
    <h2 className={joinClassNames(styles.panelTitle, className)} {...props} />
  );
};

type RowProps = {
  children: ReactNode;
};

export const Row = ({ children }: RowProps) => {
  return <div className={styles.row}>{children}</div>;
};

export const Select = ({ className, ...props }: ComponentProps<'select'>) => {
  return (
    <select className={joinClassNames(styles.select, className)} {...props} />
  );
};

export const Mono = ({ className, ...props }: ComponentProps<'span'>) => {
  return <span className={joinClassNames(styles.mono, className)} {...props} />;
};
