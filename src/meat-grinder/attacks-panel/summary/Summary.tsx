import { useMemo } from "react";
import { summarizeActivation } from "@/core/activation/summary/activationSummary";
import { formatPercent, formatRange, formatSigned } from "@/core/shared/format";
import { PanelTitle } from "@/ui/ui";
import { useActivationInput } from "../useActivationInput";
import { OddsRow } from "./OddsRow";
import { SummaryStat } from "./SummaryStat";
import styles from "./summary.module.css";
import {
  TOOLTIP_DAMAGE_RANGE,
  TOOLTIP_EXPECTED_DAMAGE,
  TOOLTIP_HP_LEFT,
  TOOLTIP_KILL,
  TOOLTIP_PLAN_FAILS,
} from "./summaryCopy";

const EXPECTED_VALUE_DIGITS = 1;

export const Summary = () => {
  const input = useActivationInput();
  const summary = useMemo(() => summarizeActivation(input), [input]);

  return (
    <section className={styles.summary} aria-label="Activation odds and totals">
      <PanelTitle className={styles.sectionTitle}>Odds</PanelTitle>
      {summary.activeAttacks.map((swing, displayIndex) => (
        <OddsRow
          key={swing.attackIndex}
          attackIndex={swing.attackIndex}
          displayIndex={displayIndex}
          prob={swing.prob}
        />
      ))}
      <div className={styles.oddsAggregateBlock}>
        <SummaryStat label="Kills the target" tooltip={TOOLTIP_KILL}>
          {formatPercent(summary.killProbability)}
        </SummaryStat>
        <SummaryStat label="Plan fails" tooltip={TOOLTIP_PLAN_FAILS}>
          {formatPercent(summary.planFailureProbability)}
        </SummaryStat>
        <SummaryStat label="Expected damage" tooltip={TOOLTIP_EXPECTED_DAMAGE}>
          {summary.expectedDamage.toFixed(EXPECTED_VALUE_DIGITS)}
        </SummaryStat>
        <SummaryStat label="Expected HP left" tooltip={TOOLTIP_HP_LEFT}>
          {summary.expectedHpRemaining.toFixed(EXPECTED_VALUE_DIGITS)}
        </SummaryStat>
        <SummaryStat label="Likely damage" tooltip={TOOLTIP_DAMAGE_RANGE}>
          {formatRange(summary.damageRange)}
        </SummaryStat>
      </div>
      <PanelTitle className={styles.totalsSectionTitle}>Totals</PanelTitle>
      <SummaryStat label="Damage dealt" tooltip={summary.damageDealtTooltip}>
        {summary.totalDamageIfAllHit}
      </SummaryStat>
      <SummaryStat label="Net momentum" tooltip={summary.netMomentumTooltip}>
        {formatSigned(summary.netMomentumIfAllHit)}
      </SummaryStat>
    </section>
  );
};
