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
import { damageQuantile, planDamageOutcome } from '@/core/killOdds';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { KILLING_BLOW_MOMENTUM } from '@/types/gbMeatGrinder/simulation';
import { Mono, PanelTitle, Summary } from '@/components/ui';
import { InfoTip } from '@/components/InfoTip';
import { attackKindLabel } from '@/components/attacks/attackVariant';

const ProbabilitySummaryTitle = styled(PanelTitle)`
  margin-bottom: 0.5rem;
`;

const ProbabilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  padding: 0.2rem 0.4rem;
  margin: 0 -0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text);
  transition: background-color 0.1s ease;

  &:hover {
    background: var(--row-hover);
  }
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

const TOOLTIP_PLAN_FAILS =
  'Chance the plan does not fully come together: 1 - P(every selected swing reaches its picked wrap line). A swing with no picks always "succeeds". High here means your line relies on rolls that often whiff, even if expected damage looks fine.';

const TOOLTIP_HP_LEFT =
  'Mean target HP remaining afterwards: average of max(0, HP - total damage) over every outcome. ~0 means a near-certain kill; a large number means you need another activation.';

const TOOLTIP_DAMAGE_RANGE =
  'Likely total damage: the 10th-90th percentile band. Roughly 8 in 10 activations land in this range, so a wide band means the result is swingy and a tight band means it is reliable.';

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
    effectiveBonusTimeByAttack,
    effectiveWrapPicks,
    ignoredAttackIndex,
    damageMods,
    specialAbilities,
    attacks,
    killingBlowIndex,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging ? chargeAttackIndex : -1;

  // A Resilient target ignores the first swing entirely, and the activation ends
  // on the killing blow, so every total/odds below counts only the swings that
  // actually happen: from after any ignored lead swing through the killing blow.
  const activeAttacks = useMemo(() => {
    const start = ignoredAttackIndex >= 0 ? ignoredAttackIndex + 1 : 0;
    const end = killingBlowIndex >= 0 ? killingBlowIndex + 1 : attacks.length;
    return attacks.slice(start, end);
  }, [attacks, ignoredAttackIndex, killingBlowIndex]);

  const rowDamageIfHit = useMemo(
    () =>
      damageIfAllHitsWrap(
        attacker,
        effectiveWrapPicks,
        damageMods,
        activeBaseCount,
      ),
    [attacker, effectiveWrapPicks, damageMods, activeBaseCount],
  );

  const flatDamage = useMemo(
    () => specialAbilityFlatDamage(attacker, specialAbilities),
    [attacker, specialAbilities],
  );

  const totalDamageIfAllHit = useMemo(
    () =>
      activeAttacks.reduce((s, ctx) => s + rowDamageIfHit[ctx.attackIndex], 0) +
      flatDamage,
    [activeAttacks, rowDamageIfHit, flatDamage],
  );

  const momentousMomentumIfAllHit = useMemo(() => {
    let m = 0;
    for (const ctx of activeAttacks) {
      for (const id of effectiveWrapPicks[ctx.attackIndex] ?? []) {
        if (id != null && pickGeneratesMomentum(attacker, id, damageMods))
          m += 1;
      }
    }
    return m;
  }, [attacker, activeAttacks, effectiveWrapPicks, damageMods]);

  const bonusTimeSpendsInActivation = useMemo(
    () =>
      activeAttacks.filter((ctx) => effectiveBonusTimeByAttack[ctx.attackIndex])
        .length,
    [activeAttacks, effectiveBonusTimeByAttack],
  );

  const killingBlowMomentum = killingBlowIndex >= 0 ? KILLING_BLOW_MOMENTUM : 0;

  const netMomentumIfAllHit = useMemo(() => {
    if (activeAttacks.length === 0) return killingBlowMomentum;
    const lastIdx = activeAttacks[activeAttacks.length - 1].attackIndex;
    const end = momentumAfterAttackInclusive(
      attacker,
      effectiveWrapPicks,
      damageMods,
      lastIdx,
      startingMomentum,
      effectiveBonusTimeByAttack,
      activeBaseCount,
    );
    return end + killingBlowMomentum - startingMomentum;
  }, [
    attacker,
    activeAttacks,
    effectiveWrapPicks,
    damageMods,
    startingMomentum,
    effectiveBonusTimeByAttack,
    activeBaseCount,
    killingBlowMomentum,
  ]);

  const netMomentumTooltip = useMemo(() => {
    let t = `+${momentousMomentumIfAllHit} from momentous results`;
    if (killingBlowMomentum > 0) {
      t += `; +${killingBlowMomentum} killing blow`;
    }
    if (bonusTimeSpendsInActivation > 0) {
      t += `; -${bonusTimeSpendsInActivation} Bonus Time`;
    }
    return `${t}.`;
  }, [
    momentousMomentumIfAllHit,
    killingBlowMomentum,
    bonusTimeSpendsInActivation,
  ]);

  const activeFlatAbilities = useMemo(
    () =>
      (attacker.specialAbilities ?? []).filter((a) => specialAbilities[a.id]),
    [attacker, specialAbilities],
  );

  const damageDealtTooltip = useMemo(() => {
    const b = damageModifierBreakdownWrap(
      attacker,
      effectiveWrapPicks,
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
    effectiveWrapPicks,
    damageMods,
    activeBaseCount,
    flatDamage,
    activeFlatAbilities,
  ]);

  const planFailureProbability = useMemo(
    () => 1 - activeAttacks.reduce((p, a) => p * a.prob, 1),
    [activeAttacks],
  );

  const { killProbability, expectedDamage, expectedHpRemaining, damageRange } =
    useMemo(() => {
      const outcome = planDamageOutcome(
        attacker,
        activeAttacks,
        effectiveWrapPicks,
        damageMods,
        flatDamage,
        targetHp,
      );
      return {
        ...outcome,
        damageRange: {
          low: damageQuantile(outcome.damageDistribution, 0.1),
          high: damageQuantile(outcome.damageDistribution, 0.9),
        },
      };
    }, [
      attacker,
      activeAttacks,
      effectiveWrapPicks,
      damageMods,
      flatDamage,
      targetHp,
    ]);

  return (
    <Summary as="section" aria-label="Per-swing hit odds">
      <ProbabilitySummaryTitle>Odds</ProbabilitySummaryTitle>
      {activeAttacks.map((a, displayIdx) => (
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
                effectiveWrapPicks[a.attackIndex] ?? [],
                damageMods,
              )}
            </SelectionPicksInline>
          </SelectionLine>
          <Mono>
            {swingHasWrapSelection(effectiveWrapPicks[a.attackIndex])
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
          <InfoTip content={TOOLTIP_PLAN_FAILS}>Plan fails</InfoTip>
          <Mono>{formatPercent(planFailureProbability)}</Mono>
        </ProbabilityRow>
        <ProbabilityRow>
          <InfoTip content={TOOLTIP_EXPECTED_DAMAGE}>Expected damage</InfoTip>
          <Mono>{expectedDamage.toFixed(1)}</Mono>
        </ProbabilityRow>
        <ProbabilityRow>
          <InfoTip content={TOOLTIP_HP_LEFT}>Expected HP left</InfoTip>
          <Mono>{expectedHpRemaining.toFixed(1)}</Mono>
        </ProbabilityRow>
        <ProbabilityRow>
          <InfoTip content={TOOLTIP_DAMAGE_RANGE}>Likely damage</InfoTip>
          <Mono>
            {damageRange.low === damageRange.high
              ? damageRange.low
              : `${damageRange.low}-${damageRange.high}`}
          </Mono>
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
