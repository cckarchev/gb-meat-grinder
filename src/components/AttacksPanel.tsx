import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/playbook';
import { useMeatGrinderSimulation } from '@/meatGrinder/useMeatGrinderSimulation';
import { AttackSwingRow } from '@/components/attacks/AttackSwingRow';
import { AttacksPanelSummary } from '@/components/attacks/AttacksPanelSummary';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export function AttacksPanel() {
  const {
    hp: targetHp,
    armor,
    charging,
    chargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    bonusTimeByAttack,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    attacks,
    dispatch,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging ? chargeAttackIndex : -1;

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
    () => damageIfAllHitsWrap(wrapPicks, damageMods, activeBaseCount),
    [wrapPicks, damageMods, activeBaseCount],
  );
  const remainingHpAfterSwing = useMemo(() => {
    const out: number[] = [];
    let dealt = 0;
    for (const ctx of attacks) {
      dealt += rowDamageIfHit[ctx.attackIndex];
      out.push(Math.max(0, targetHp - dealt));
    }
    return out;
  }, [attacks, rowDamageIfHit, targetHp]);

  const momentumAfterSwing = useMemo(
    () =>
      attacks.map((ctx) =>
        momentumAfterAttackInclusive(
          wrapPicks,
          damageMods,
          ctx.attackIndex,
          startingMomentum,
          bonusTimeByAttack,
          activeBaseCount,
        ),
      ),
    [
      attacks,
      wrapPicks,
      damageMods,
      startingMomentum,
      bonusTimeByAttack,
      activeBaseCount,
    ],
  );

  const bonusTimePoolBeforeSwing = useMemo(
    () =>
      attacks.map((ctx) =>
        momentumPoolBeforeBonusTime(
          wrapPicks,
          damageMods,
          ctx.attackIndex,
          startingMomentum,
          bonusTimeByAttack,
          activeBaseCount,
        ),
      ),
    [
      attacks,
      wrapPicks,
      damageMods,
      startingMomentum,
      bonusTimeByAttack,
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
          armor={armor}
          charging={charging}
          chargeAttackIndex={effectiveChargeAttackIndex}
          activeBaseCount={activeBaseCount}
          wrapPicks={wrapPicks}
          characterPlayPicks={characterPlayPicks}
          damageMods={damageMods}
          remainingHpIfHit={remainingHpAfterSwing[displayIdx]}
          momentum={momentumAfterSwing[displayIdx]}
          bonusTime={bonusTimeByAttack[a.attackIndex] === true}
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
