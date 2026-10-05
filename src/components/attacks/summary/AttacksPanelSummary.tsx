import { useMemo } from 'react';
import {
  TOOLTIP_DAMAGE_RANGE,
  TOOLTIP_EXPECTED_DAMAGE,
  TOOLTIP_HP_LEFT,
  TOOLTIP_KILL,
  TOOLTIP_PLAN_FAILS,
} from '@/components/attacks/summary/attacksSummaryCopy';
import {
  OddsAggregateBlock,
  Summary,
  SummarySectionTitle,
  TotalsSectionTitle,
} from '@/components/attacks/summary/attacksSummaryStyles';
import { SummaryOddsRow } from '@/components/attacks/summary/SummaryOddsRow';
import { SummaryStat } from '@/components/attacks/summary/SummaryStat';
import { useActivationInput } from '@/components/attacks/useActivationInput';
import { summarizeActivation } from '@/core/activation/summary/activationSummary';
import { formatPercent, formatRange, formatSigned } from '@/core/shared/format';

const EXPECTED_VALUE_DIGITS = 1;

export const AttacksPanelSummary = () => {
  const input = useActivationInput();
  const summary = useMemo(() => summarizeActivation(input), [input]);

  return (
    <Summary aria-label="Activation odds and totals">
      <SummarySectionTitle>Odds</SummarySectionTitle>
      {summary.activeAttacks.map((swing, displayIndex) => (
        <SummaryOddsRow
          key={swing.attackIndex}
          attackIndex={swing.attackIndex}
          displayIndex={displayIndex}
          prob={swing.prob}
        />
      ))}
      <OddsAggregateBlock>
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
      </OddsAggregateBlock>
      <TotalsSectionTitle>Totals</TotalsSectionTitle>
      <SummaryStat label="Damage dealt" tooltip={summary.damageDealtTooltip}>
        {summary.totalDamageIfAllHit}
      </SummaryStat>
      <SummaryStat label="Net momentum" tooltip={summary.netMomentumTooltip}>
        {formatSigned(summary.netMomentumIfAllHit)}
      </SummaryStat>
    </Summary>
  );
};
