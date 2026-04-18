import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  damageIfAllHitsWrap,
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '../core/playbook';
import { useKillItSimulation } from '../killIt/useKillItSimulation';
import { AttackSwingRow } from './attacks/AttackSwingRow';

export type { AttacksPanelProps } from './attacks/types';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export function AttacksPanel() {
  const {
    hp: targetHp,
    armor,
    chargeAttackIndex,
    startingMomentum,
    bonusTimeByAttack,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    attacks,
    dispatch,
  } = useKillItSimulation();

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
    () => damageIfAllHitsWrap(wrapPicks, damageMods),
    [wrapPicks, damageMods],
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
        ),
      ),
    [attacks, wrapPicks, damageMods, startingMomentum, bonusTimeByAttack],
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
        ),
      ),
    [attacks, wrapPicks, damageMods, startingMomentum, bonusTimeByAttack],
  );

  return (
    <AttacksList>
      {attacks.map((a, displayIdx) => (
        <AttackSwingRow
          key={a.attackIndex}
          attack={a}
          displayIdx={displayIdx}
          armor={armor}
          chargeAttackIndex={chargeAttackIndex}
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
    </AttacksList>
  );
}
