import { useMemo } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  formatWrapRowSelectionLabel,
  momentumAfterAttackInclusive,
  pickGeneratesMomentum,
  type WrapPick,
} from '../../core/playbook';
import { formatPercent } from '../../core/probability';
import { useKillItSimulation } from '../../killIt/useKillItSimulation';
import { Mono, Summary } from '../ui';
import { attackKindLabel } from './attackVariant';

const ProbabilitySummaryTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 0.5rem;
`;

const ProbabilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  font-size: 0.9rem;
  color: var(--text);
`;

const SelectionLine = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.35;
`;

const SelectionPicksInline = styled.span`
  color: var(--muted);
  font-weight: 500;
`;

const CombinedOddsRow = styled(ProbabilityRow)`
  margin-top: 0.2rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);
  font-size: 0.98rem;
  font-weight: 600;
`;

const CombinedOddsValue = styled(Mono)`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
`;

const TotalsSectionTitle = styled(ProbabilitySummaryTitle)`
  margin-top: 1rem;
`;

/** Dotted underline hints native `title` breakdown (momentous / Bonus Time). */
const NetMomentumMono = styled(Mono)`
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.12em;
`;

function swingHasWrapSelection(picks: readonly WrapPick[] | undefined): boolean {
  return (picks ?? []).some((id) => id != null);
}

export function AttacksPanelSummary() {
  const {
    chargeAttackIndex,
    startingMomentum,
    bonusTimeByAttack,
    wrapPicks,
    damageMods,
    attacks,
    probAllSelectedHits,
  } = useKillItSimulation();

  const rowDamageIfHit = useMemo(
    () => damageIfAllHitsWrap(wrapPicks, damageMods),
    [wrapPicks, damageMods],
  );

  const totalDamageIfAllHit = useMemo(
    () => attacks.reduce((s, ctx) => s + rowDamageIfHit[ctx.attackIndex], 0),
    [attacks, rowDamageIfHit],
  );

  const momentousMomentumIfAllHit = useMemo(() => {
    let m = 0;
    for (const ctx of attacks) {
      for (const id of wrapPicks[ctx.attackIndex] ?? []) {
        if (id != null && pickGeneratesMomentum(id, damageMods)) m += 1;
      }
    }
    return m;
  }, [attacks, wrapPicks, damageMods]);

  const bonusTimeSpendsInActivation = useMemo(
    () => attacks.filter((ctx) => bonusTimeByAttack[ctx.attackIndex]).length,
    [attacks, bonusTimeByAttack],
  );

  const netMomentumIfAllHit = useMemo(() => {
    if (attacks.length === 0) return 0;
    const lastIdx = attacks[attacks.length - 1].attackIndex;
    const end = momentumAfterAttackInclusive(
      wrapPicks,
      damageMods,
      lastIdx,
      startingMomentum,
      bonusTimeByAttack,
    );
    return end - startingMomentum;
  }, [attacks, wrapPicks, damageMods, startingMomentum, bonusTimeByAttack]);

  const netMomentumTooltip = useMemo(() => {
    let t = `+${momentousMomentumIfAllHit} from momentous results`;
    if (bonusTimeSpendsInActivation > 0) {
      t += `; −${bonusTimeSpendsInActivation} Bonus Time`;
    }
    return `${t}.`;
  }, [momentousMomentumIfAllHit, bonusTimeSpendsInActivation]);

  const everySwingHasWrapPick = useMemo(
    () =>
      attacks.every((ctx) => swingHasWrapSelection(wrapPicks[ctx.attackIndex])),
    [attacks, wrapPicks],
  );

  return (
    <Summary as="section" aria-label="Per-swing hit odds">
      <ProbabilitySummaryTitle>Odds</ProbabilitySummaryTitle>
      {attacks.map((a, displayIdx) => (
        <ProbabilityRow key={a.attackIndex}>
          <SelectionLine>
            <Mono>{displayIdx + 1}</Mono>.{' '}
            {attackKindLabel(a.attackIndex, chargeAttackIndex)}
            {' -> '}
            <SelectionPicksInline>
              {formatWrapRowSelectionLabel(
                wrapPicks[a.attackIndex] ?? [],
                damageMods,
              )}
            </SelectionPicksInline>
          </SelectionLine>
          <Mono>
            {swingHasWrapSelection(wrapPicks[a.attackIndex])
              ? formatPercent(a.prob)
              : '-'}
          </Mono>
        </ProbabilityRow>
      ))}
      <CombinedOddsRow>
        <span>All swings hit</span>
        <CombinedOddsValue>
          {everySwingHasWrapPick ? formatPercent(probAllSelectedHits) : '-'}
        </CombinedOddsValue>
      </CombinedOddsRow>
      <TotalsSectionTitle>Totals</TotalsSectionTitle>
      <ProbabilityRow>
        <span>Damage dealt</span>
        <Mono>{totalDamageIfAllHit}</Mono>
      </ProbabilityRow>
      <ProbabilityRow>
        <span>Net momentum</span>
        <NetMomentumMono title={netMomentumTooltip}>
          {netMomentumIfAllHit > 0 ? '+' : ''}
          {netMomentumIfAllHit}
        </NetMomentumMono>
      </ProbabilityRow>
    </Summary>
  );
}
