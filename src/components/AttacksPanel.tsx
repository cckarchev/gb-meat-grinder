import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  chargeFlatDamageSwingIndex,
  damageIfAllHitsWrap,
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
  specialAbilityFlatDamage,
} from '@/core/playbook';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { KILLING_BLOW_MOMENTUM } from '@/types/gbMeatGrinder/simulation';
import { AttackSwingRow } from '@/components/attacks/AttackSwingRow';
import { AttacksPanelSummary } from '@/components/attacks/AttacksPanelSummary';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export function AttacksPanel() {
  const {
    attacker,
    hp: targetHp,
    charging,
    chargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    wrapPicks,
    characterPlayPicks,
    effectiveWrapPicks,
    effectiveCharacterPlayPicks,
    effectiveBonusTimeByAttack,
    ignoredAttackIndex,
    damageMods,
    specialAbilities,
    attacks,
    killingBlowIndex,
    dispatch,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging ? chargeAttackIndex : -1;
  const chargeFlatDamageIndex = chargeFlatDamageSwingIndex(
    attacker,
    specialAbilities,
    charging,
    effectiveChargeAttackIndex,
  );

  const [wrapExpanded, setWrapExpanded] = useState(() => new Set<number>());

  const toggleWrapExpanded = (attackIndex: number) => {
    setWrapExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(attackIndex)) next.delete(attackIndex);
      else next.add(attackIndex);
      return next;
    });
  };

  const rowDamageIfHit = useMemo(
    () =>
      damageIfAllHitsWrap(
        attacker,
        effectiveWrapPicks,
        effectiveCharacterPlayPicks,
        damageMods,
        activeBaseCount,
        chargeFlatDamageIndex,
      ),
    [
      attacker,
      effectiveWrapPicks,
      effectiveCharacterPlayPicks,
      damageMods,
      activeBaseCount,
      chargeFlatDamageIndex,
    ],
  );
  const remainingHpAfterSwing = useMemo(() => {
    const out: number[] = [];
    // Special-ability damage is guaranteed and untied to a swing, so apply it
    // up front as a baseline before the per-swing chip damage.
    let dealt = specialAbilityFlatDamage(attacker, specialAbilities, charging);
    for (const ctx of attacks) {
      dealt += rowDamageIfHit[ctx.attackIndex];
      out.push(Math.max(0, targetHp - dealt));
    }
    return out;
  }, [attacker, specialAbilities, charging, attacks, rowDamageIfHit, targetHp]);

  const momentumAfterSwing = useMemo(() => {
    const base = attacks.map((ctx) =>
      momentumAfterAttackInclusive(
        attacker,
        effectiveWrapPicks,
        damageMods,
        ctx.attackIndex,
        startingMomentum,
        effectiveBonusTimeByAttack,
        activeBaseCount,
      ),
    );
    if (killingBlowIndex < 0) return base;
    // The activation ends on the killing blow: that swing earns +1 momentum and
    // later (disabled) swings freeze at the post-kill total.
    const afterKill = base[killingBlowIndex] + KILLING_BLOW_MOMENTUM;
    return base.map((m, idx) => (idx >= killingBlowIndex ? afterKill : m));
  }, [
    attacker,
    attacks,
    effectiveWrapPicks,
    damageMods,
    startingMomentum,
    effectiveBonusTimeByAttack,
    activeBaseCount,
    killingBlowIndex,
  ]);

  const bonusTimePoolBeforeSwing = useMemo(
    () =>
      attacks.map((ctx) =>
        momentumPoolBeforeBonusTime(
          attacker,
          effectiveWrapPicks,
          damageMods,
          ctx.attackIndex,
          startingMomentum,
          effectiveBonusTimeByAttack,
          activeBaseCount,
        ),
      ),
    [
      attacker,
      attacks,
      effectiveWrapPicks,
      damageMods,
      startingMomentum,
      effectiveBonusTimeByAttack,
      activeBaseCount,
    ],
  );

  return (
    <AttacksList>
      {attacks.map((a, displayIdx) => (
        <AttackSwingRow
          key={a.attackIndex}
          attack={a}
          displayIdx={displayIdx}
          disabled={
            displayIdx === ignoredAttackIndex ||
            (killingBlowIndex >= 0 && displayIdx > killingBlowIndex)
          }
          isKillingBlow={displayIdx === killingBlowIndex}
          armor={a.armor}
          charging={charging}
          chargeAttackIndex={effectiveChargeAttackIndex}
          activeBaseCount={activeBaseCount}
          wrapPicks={wrapPicks}
          characterPlayPicks={characterPlayPicks}
          damageMods={damageMods}
          remainingHpIfHit={remainingHpAfterSwing[displayIdx]}
          momentum={momentumAfterSwing[displayIdx]}
          bonusTime={effectiveBonusTimeByAttack[a.attackIndex] === true}
          bonusTimeMomentumPool={bonusTimePoolBeforeSwing[displayIdx]}
          onBonusTimeChange={(attackIndex, value) =>
            dispatch({ type: 'bonusTime', attackIndex, value })
          }
          wrapOpen={wrapExpanded.has(a.attackIndex)}
          onChargeAttackIndexChange={(index) =>
            dispatch({ type: 'chargeAttackIndex', value: index })
          }
          onChoiceChange={(attackIndex, pickIndex, id) =>
            dispatch({ type: 'wrapChoice', attackIndex, pickIndex, id })
          }
          onCharacterPlayPickChange={(attackIndex, pickIndex, pick) =>
            dispatch({
              type: 'characterPlayPick',
              attackIndex,
              pickIndex,
              pick,
            })
          }
          onToggleWrapExpansion={() => toggleWrapExpanded(a.attackIndex)}
          onWrapContinuationCleared={(attackIndex) =>
            dispatch({ type: 'clearWrapContinuation', attackIndex })
          }
        />
      ))}
      <AttacksPanelSummary />
    </AttacksList>
  );
}
