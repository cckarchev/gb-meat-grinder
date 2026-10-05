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
  ProbabilityRow,
  ProbabilitySummaryTitle,
  SelectionLine,
  SelectionPicksInline,
  TotalsSectionTitle,
} from '@/components/attacks/summary/attacksSummaryStyles';
import { SummaryStat } from '@/components/attacks/summary/SummaryStat';
import { Mono, Summary } from '@/components/ui/ui';
import { summarizeActivation } from '@/core/activation/activationSummary';
import { attackKindLabel } from '@/core/attacks/attackVariant';
import { formatPercent } from '@/core/damage/probability';
import type { WrapPick } from '@/core/playbook/playbook.types';
import { formatWrapRowSelectionLabel } from '@/core/playbook/playbookLabels';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const EXPECTED_VALUE_DIGITS = 1;

const swingHasWrapSelection = (
  picks: readonly WrapPick[] | undefined,
): boolean => {
  return (picks ?? []).some((id) => id != null);
};

const formatRange = ({ low, high }: { low: number; high: number }): string => {
  return low === high ? `${low}` : `${low}-${high}`;
};

const formatSigned = (value: number): string => {
  return value > 0 ? `+${value}` : `${value}`;
};

export const AttacksPanelSummary = () => {
  const {
    attacker,
    hp: targetHp,
    charging,
    chargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    effectiveBonusTimeByAttack,
    effectiveWrapPicks,
    ignoredAttackIndex,
    damageMods,
    specialAbilities,
    attacks,
    killingBlowIndex,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging
    ? chargeAttackIndex
    : NO_ATTACK_INDEX;

  const summary = useMemo(
    () =>
      summarizeActivation({
        attacker,
        attacks,
        ignoredAttackIndex,
        killingBlowIndex,
        wrapPicks: effectiveWrapPicks,
        bonusTimeByAttack: effectiveBonusTimeByAttack,
        damageMods,
        specialAbilities,
        startingMomentum,
        activeBaseCount,
        targetHp,
      }),
    [
      attacker,
      attacks,
      ignoredAttackIndex,
      killingBlowIndex,
      effectiveWrapPicks,
      effectiveBonusTimeByAttack,
      damageMods,
      specialAbilities,
      startingMomentum,
      activeBaseCount,
      targetHp,
    ],
  );

  return (
    <Summary as="section" aria-label="Per-swing hit odds">
      <ProbabilitySummaryTitle>Odds</ProbabilitySummaryTitle>
      {summary.activeAttacks.map((swing, displayIdx) => (
        <ProbabilityRow key={swing.attackIndex}>
          <SelectionLine>
            <Mono>{displayIdx + 1}</Mono>.{' '}
            {attackKindLabel(
              attacker,
              swing.attackIndex,
              effectiveChargeAttackIndex,
            )}
            {' -> '}
            <SelectionPicksInline>
              {formatWrapRowSelectionLabel(
                attacker,
                effectiveWrapPicks[swing.attackIndex] ?? [],
                damageMods,
              )}
            </SelectionPicksInline>
          </SelectionLine>
          <Mono>
            {swingHasWrapSelection(effectiveWrapPicks[swing.attackIndex])
              ? formatPercent(swing.prob)
              : '-'}
          </Mono>
        </ProbabilityRow>
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
