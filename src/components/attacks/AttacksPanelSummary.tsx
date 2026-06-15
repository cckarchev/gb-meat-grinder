import { useMemo } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
  formatWrapRowSelectionLabel,
  momentumAfterAttackInclusive,
  pickGeneratesMomentum,
} from '@/core/playbook';
import type { WrapPick } from '@/types/core/playbook';
import { formatPercent } from '@/core/probability';
import { useMeatGrinderSimulation } from '@/meatGrinder/useMeatGrinderSimulation';
import { Mono, Summary } from '@/components/ui';
import { attackKindLabel } from '@/components/attacks/attackVariant';

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

const OddsAggregateBlock = styled.div`
  margin-top: 0.2rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
`;

const ThemedOddsLabel = styled.span`
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.1em;
`;

const TOOLTIP_GEOMETRIC_VIOLENCE =
  'Geometric mean of each swing\'s "all selected lines hit" chance (n-th root of the product of those probabilities), counting only swings where you picked playbook lines. Weighs low rolls more than a plain average: one rough swing pulls the whole number down. Each roll is still its own independent dice pool. This is not P(all swings hit every line at once).';

const TOOLTIP_ROUGHEST_ROLL =
  'The lowest per-swing hit chance among swings with a pick. The roll that usually gives you the most grief if every selected line has to land.';

const TotalsSectionTitle = styled(ProbabilitySummaryTitle)`
  margin-top: 1rem;
`;

/** Dotted underline hints native `title` on summary stat values. */
const SummaryStatMono = styled(Mono)`
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.12em;
`;

function swingHasWrapSelection(
  picks: readonly WrapPick[] | undefined,
): boolean {
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
  } = useMeatGrinderSimulation();

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
      t += `; -${bonusTimeSpendsInActivation} Bonus Time`;
    }
    return `${t}.`;
  }, [momentousMomentumIfAllHit, bonusTimeSpendsInActivation]);

  const damageDealtTooltip = useMemo(() => {
    const b = damageModifierBreakdownWrap(wrapPicks, damageMods);
    if (b.rawCardDamage === 0 && b.totalEffective === 0) {
      return 'No selected playbook lines deal card damage to HP (after Tough Hide).';
    }
    let t = `${b.rawCardDamage} from card pips`;
    if (b.toughHideReduction > 0) {
      t += `; -${b.toughHideReduction} Tough Hide`;
    }
    if (b.tooledUpBonus > 0) {
      t += `; +${b.tooledUpBonus} Tooled Up`;
    }
    if (b.theOwnerBonus > 0) {
      t += `; +${b.theOwnerBonus} The Owner`;
    }
    t += ` = ${b.totalEffective}.`;
    return t;
  }, [wrapPicks, damageMods]);

  const { geometricMeanLineHitProb, roughestRollProb } = useMemo(() => {
    const probs = attacks
      .filter((ctx) => swingHasWrapSelection(wrapPicks[ctx.attackIndex]))
      .map((ctx) => ctx.prob);
    if (probs.length === 0) {
      return {
        geometricMeanLineHitProb: null as number | null,
        roughestRollProb: null as number | null,
      };
    }
    if (probs.some((p) => p <= 0)) {
      return {
        geometricMeanLineHitProb: 0,
        roughestRollProb: Math.min(...probs),
      };
    }
    const logSum = probs.reduce((s, p) => s + Math.log(p), 0);
    return {
      geometricMeanLineHitProb: Math.exp(logSum / probs.length),
      roughestRollProb: Math.min(...probs),
    };
  }, [attacks, wrapPicks]);

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
      <OddsAggregateBlock>
        <ProbabilityRow>
          <ThemedOddsLabel title={TOOLTIP_GEOMETRIC_VIOLENCE}>
            Average violence
          </ThemedOddsLabel>
          <Mono title={TOOLTIP_GEOMETRIC_VIOLENCE}>
            {geometricMeanLineHitProb != null
              ? formatPercent(geometricMeanLineHitProb)
              : '-'}
          </Mono>
        </ProbabilityRow>
        <ProbabilityRow>
          <ThemedOddsLabel title={TOOLTIP_ROUGHEST_ROLL}>
            Roughest roll
          </ThemedOddsLabel>
          <Mono title={TOOLTIP_ROUGHEST_ROLL}>
            {roughestRollProb != null ? formatPercent(roughestRollProb) : '-'}
          </Mono>
        </ProbabilityRow>
      </OddsAggregateBlock>
      <TotalsSectionTitle>Totals</TotalsSectionTitle>
      <ProbabilityRow>
        <span title={damageDealtTooltip}>Damage dealt</span>
        <SummaryStatMono title={damageDealtTooltip}>
          {totalDamageIfAllHit}
        </SummaryStatMono>
      </ProbabilityRow>
      <ProbabilityRow>
        <span>Net momentum</span>
        <SummaryStatMono title={netMomentumTooltip}>
          {netMomentumIfAllHit > 0 ? '+' : ''}
          {netMomentumIfAllHit}
        </SummaryStatMono>
      </ProbabilityRow>
    </Summary>
  );
}
