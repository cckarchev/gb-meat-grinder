import type { ReactNode } from 'react';
import styles from '@/components/ui/ToggleGroup.module.css';
import type { CustomPropertyStyle } from '@/styles/customProperties';

type ToggleGroupLayoutProps = {
  children: ReactNode;
};

/** Panel footer holding toggle groups stacked with even spacing. */
export const ToggleGroupStack = ({ children }: ToggleGroupLayoutProps) => {
  return <div className={styles.toggleGroupStack}>{children}</div>;
};

/** Two toggle groups side by side, stacked on the narrowest screens. */
export const ToggleGroupPair = ({ children }: ToggleGroupLayoutProps) => {
  return <div className={styles.toggleGroupPair}>{children}</div>;
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
