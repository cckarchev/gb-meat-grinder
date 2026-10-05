import type { ReactNode } from 'react';
import { ProbabilityRow } from '@/components/attacks/summary/attacksSummaryStyles';
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
    <ProbabilityRow>
      <InfoTip content={tooltip}>{label}</InfoTip>
      <Mono>{children}</Mono>
    </ProbabilityRow>
  );
};
