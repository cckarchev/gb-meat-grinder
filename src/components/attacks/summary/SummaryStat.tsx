import type { ReactNode } from 'react';
import styles from '@/components/attacks/summary/attacksSummary.module.css';
import { InfoTip } from '@/components/ui/InfoTip';
import { Mono } from '@/components/ui/ui';

type SummaryStatProps = {
  label: string;
  tooltip: string;
  children: ReactNode;
};

/** One labeled figure in the attacks summary, with an explanatory tooltip. */
export const SummaryStat = ({ label, tooltip, children }: SummaryStatProps) => {
  return (
    <div className={styles.summaryRow}>
      <InfoTip content={tooltip}>{label}</InfoTip>
      <Mono>{children}</Mono>
    </div>
  );
};
