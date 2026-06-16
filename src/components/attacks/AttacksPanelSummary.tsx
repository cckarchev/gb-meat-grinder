import { useMemo } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
  formatWrapRowSelectionLabel,
  momentumAfterAttackInclusive,
  pickGeneratesMomentum,
  specialAbilityFlatDamage,
} from '@/core/playbook';
import type { WrapPick } from '@/types/core/playbook';
import { formatPercent } from '@/core/probability';
import { planDamageOutcome } from '@/core/killOdds';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { Mono, Summary } from '@/components/ui';
import { InfoTip } from '@/components/InfoTip';
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

const TOOLTIP_KILL =
  'Chance this activation drops the target: P(total damage >= remaining HP) using the lines you actually picked. Each swing deals its picked damage when the roll reaches it, or the best lower column it does reach; each swing rolls its own dice pool. Guaranteed special-ability damage is included, and the swings shown are assumed to happen.';

const TOOLTIP_EXPECTED_DAMAGE =
  'Mean total damage across the activation using your picked lines (best lower column on an under-roll), plus guaranteed special-ability damage.';

const TotalsSectionTitle = styled(ProbabilitySummaryTitle)`
  margin-top: 1rem;
`;

function swingHasWrapSelection(
  picks: readonly WrapPick[] | undefined,
): boolean {
  return (picks ?? []).some((id) => id != null);
}

export function AttacksPanelSummary() {
  const {
    attacker,
    hp: targetHp,
    charging,
    chargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    bonusTimeByAttack,
    wrapPicks,
    damageMods,
    specialAbilities,
    attacks,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging ? chargeAttackIndex : -1;

  const rowDamageIfHit = useMemo(
    () => damageIfAllHitsWrap(attacker, wrapPicks, damageMods, activeBaseCount),
    [attacker, wrapPicks, damageMods, activeBaseCount],
  );

  const flatDamage = useMemo(
    () => specialAbilityFlatDamage(attacker, specialAbilities),
    [attacker, specialAbilities],
  );

  const totalDamageIfAllHit = useMemo(
    () =>
      attacks.reduce((s, ctx) => s + rowDamageIfHit[ctx.attackIndex], 0) +
      flatDamage,
    [attacks, rowDamageIfHit, flatDamage],
  );

  const momentousMomentumIfAllHit = useMemo(() => {
    let m = 0;
    for (const ctx of attacks) {
      for (const id of wrapPicks[ctx.attackIndex] ?? []) {
        if (id != null && pickGeneratesMomentum(attacker, id, damageMods))
          m += 1;
      }
    }
    return m;
  }, [attacker, attacks, wrapPicks, damageMods]);

  const bonusTimeSpendsInActivation = useMemo(
    () => attacks.filter((ctx) => bonusTimeByAttack[ctx.attackIndex]).length,
    [attacks, bonusTimeByAttack],
  );

  const netMomentumIfAllHit = useMemo(() => {
    if (attacks.length === 0) return 0;
    const lastIdx = attacks[attacks.length - 1].attackIndex;
    const end = momentumAfterAttackInclusive(
      attacker,
      wrapPicks,
      damageMods,
      lastIdx,
      startingMomentum,
      bonusTimeByAttack,
      activeBaseCount,
    );
    return end - startingMomentum;
  }, [
    attacker,
    attacks,
    wrapPicks,
    damageMods,
    startingMomentum,
    bonusTimeByAttack,
    activeBaseCount,
  ]);

  const netMomentumTooltip = useMemo(() => {
    let t = `+${momentousMomentumIfAllHit} from momentous results`;
    if (bonusTimeSpendsInActivation > 0) {
      t += `; -${bonusTimeSpendsInActivation} Bonus Time`;
    }
    return `${t}.`;
  }, [momentousMomentumIfAllHit, bonusTimeSpendsInActivation]);

  const activeFlatAbilities = useMemo(
    () =>
      (attacker.specialAbilities ?? []).filter((a) => specialAbilities[a.id]),
    [attacker, specialAbilities],
  );

  const damageDealtTooltip = useMemo(() => {
    const b = damageModifierBreakdownWrap(
      attacker,
      wrapPicks,
      damageMods,
      activeBaseCount,
    );
    if (b.rawCardDamage === 0 && b.totalEffective === 0 && flatDamage === 0) {
      return 'No selected playbook lines deal card damage to HP (after Tough Hide).';
    }
    let t = `${b.rawCardDamage} from card pips`;
    if (b.toughHideReduction > 0) {
      t += `; -${b.toughHideReduction} Tough Hide`;
    }
    for (const bb of b.buffBonuses) {
      if (bb.bonus > 0) {
        t += `; +${bb.bonus} ${bb.label}`;
      }
    }
    for (const a of activeFlatAbilities) {
      t += `; +${a.flatDamage} ${a.label}`;
    }
    t += ` = ${b.totalEffective + flatDamage}.`;
    return t;
  }, [
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    flatDamage,
    activeFlatAbilities,
  ]);

  const { killProbability, expectedDamage } = useMemo(
    () =>
      planDamageOutcome(
        attacker,
        attacks,
        wrapPicks,
        damageMods,
        flatDamage,
        targetHp,
      ),
    [attacker, attacks, wrapPicks, damageMods, flatDamage, targetHp],
  );

  return (
    <Summary as="section" aria-label="Per-swing hit odds">
      <ProbabilitySummaryTitle>Odds</ProbabilitySummaryTitle>
      {attacks.map((a, displayIdx) => (
        <ProbabilityRow key={a.attackIndex}>
          <SelectionLine>
            <Mono>{displayIdx + 1}</Mono>.{' '}
            {attackKindLabel(
              attacker,
              a.attackIndex,
              effectiveChargeAttackIndex,
            )}
            {' -> '}
            <SelectionPicksInline>
              {formatWrapRowSelectionLabel(
                attacker,
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
          <InfoTip content={TOOLTIP_KILL}>Kills the target</InfoTip>
          <Mono>{formatPercent(killProbability)}</Mono>
        </ProbabilityRow>
        <ProbabilityRow>
          <InfoTip content={TOOLTIP_EXPECTED_DAMAGE}>Expected damage</InfoTip>
          <Mono>{expectedDamage.toFixed(1)}</Mono>
        </ProbabilityRow>
      </OddsAggregateBlock>
      <TotalsSectionTitle>Totals</TotalsSectionTitle>
      <ProbabilityRow>
        <InfoTip content={damageDealtTooltip}>Damage dealt</InfoTip>
        <Mono>{totalDamageIfAllHit}</Mono>
      </ProbabilityRow>
      <ProbabilityRow>
        <InfoTip content={netMomentumTooltip}>Net momentum</InfoTip>
        <Mono>
          {netMomentumIfAllHit > 0 ? '+' : ''}
          {netMomentumIfAllHit}
        </Mono>
      </ProbabilityRow>
    </Summary>
  );
}
