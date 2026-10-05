import type { ComponentProps } from 'react';
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

export const Row = ({ className, ...props }: ComponentProps<'div'>) => {
  return <div className={joinClassNames(styles.row, className)} {...props} />;
};

export const Select = ({ className, ...props }: ComponentProps<'select'>) => {
  return (
    <select className={joinClassNames(styles.select, className)} {...props} />
  );
};

export const Mono = ({ className, ...props }: ComponentProps<'span'>) => {
  return <span className={joinClassNames(styles.mono, className)} {...props} />;
};
