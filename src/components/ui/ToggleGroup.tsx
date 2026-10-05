import type { ComponentProps, ReactNode } from 'react';
import styles from '@/components/ui/ToggleGroup.module.css';
import type { CustomPropertyStyle } from '@/styles/customProperties';
import { joinClassNames } from '@/styles/joinClassNames';

/** Panel footer holding toggle groups stacked with even spacing. */
export const ToggleGroupStack = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      className={joinClassNames(styles.toggleGroupStack, className)}
      {...props}
    />
  );
};

/** Two toggle groups side by side, stacked on the narrowest screens. */
export const ToggleGroupPair = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      className={joinClassNames(styles.toggleGroupPair, className)}
      {...props}
    />
  );
};

type ToggleGroupProps = {
  title: string;
  color?: string;
  columns?: number;
  children: ReactNode;
};

/** A titled group of checkbox rows (conditions, guild buffs, ...). */
export const ToggleGroup = ({
  title,
  color,
  columns = 1,
  children,
}: ToggleGroupProps) => {
  // An unset color leaves the CSS fallback (muted) in place.
  const labelStyle: CustomPropertyStyle = { '--group-label-color': color };
  const listStyle: CustomPropertyStyle = { '--group-columns': columns };

  return (
    <section>
      <div className={styles.groupLabel} style={labelStyle}>
        {title}
      </div>
      <div className={styles.groupList} style={listStyle}>
        {children}
      </div>
    </section>
  );
};
