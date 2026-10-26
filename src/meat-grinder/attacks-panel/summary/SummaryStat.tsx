import type { ReactNode } from "react";
import { InfoTip } from "@/ui/info-tip/InfoTip";
import { Mono } from "@/ui/ui";
import styles from "./summary.module.css";

type SummaryStatProps = {
  label: string;
  tooltip: string;
  children: ReactNode;
};

/** One labeled figure in the attacks summary, with an explanatory tooltip. */
export const SummaryStat = ({ label, tooltip, children }: SummaryStatProps) => (
  <div className={styles.summaryRow}>
    <InfoTip content={tooltip}>{label}</InfoTip>
    <Mono>{children}</Mono>
  </div>
);
