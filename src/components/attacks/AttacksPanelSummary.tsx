import { useMemo } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
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

const TOOLTIP_AVERAGE_VIOLENCE =
  'Average of each swing\'s "all selected lines hit" chance, counting only swings where you actually picked playbook lines. Each roll is still its own independent dice pool. This is not the chance that the whole activation hits every line (that would multiply the swings together, and gets brutal fast).';

const TOOLTIP_ROUGHEST_ROLL =
  'The lowest per-swing hit chance among swings with a pick. The roll that usually gives you the most grief if every selected line has to land.';

const TotalsSectionTitle = styled(ProbabilitySummaryTitle)`
  margin-top: 1rem;
`;

/** Dotted underline hints native `title` breakdown (momentous / Bonus Time). */
const NetMomentumMono = styled(Mono)`
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.12em;
`;

const DamageDealtMono = styled(Mono)`
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

  const { avgLineHitProb, roughestRollProb } = useMemo(() => {
    const probs = attacks
      .filter((ctx) => swingHasWrapSelection(wrapPicks[ctx.attackIndex]))
      .map((ctx) => ctx.prob);
    if (probs.length === 0) {
      return {
        avgLineHitProb: null as number | null,
        roughestRollProb: null as number | null,
      };
    }
    const sum = probs.reduce((a, b) => a + b, 0);
    return {
      avgLineHitProb: sum / probs.length,
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
          <ThemedOddsLabel title={TOOLTIP_AVERAGE_VIOLENCE}>
            Average violence
          </ThemedOddsLabel>
          <Mono title={TOOLTIP_AVERAGE_VIOLENCE}>
            {avgLineHitProb != null ? formatPercent(avgLineHitProb) : '-'}
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
        <DamageDealtMono title={damageDealtTooltip}>
          {totalDamageIfAllHit}
        </DamageDealtMono>
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
