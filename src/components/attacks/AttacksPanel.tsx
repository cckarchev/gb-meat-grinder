import { useMemo } from 'react';
import styled from 'styled-components';
import { useWrapExpansion } from '@/components/attacks/playbook/useWrapExpansion';
import { AttacksPanelSummary } from '@/components/attacks/summary/AttacksPanelSummary';
import { AttackSwingRow } from '@/components/attacks/swing/AttackSwingRow';
import { useActivationInput } from '@/components/attacks/useActivationInput';
import { swingIsSkipped } from '@/core/activation/summary/activationSummary';
import { projectSwings } from '@/core/attacks/swingProjections';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const AttacksPanel = () => {
  const {
    charging,
    activeBaseCount,
    wrapPicks,
    characterPlayPicks,
    effectiveBonusTimeByAttack,
    ignoredAttackIndex,
    damageMods,
    attacks,
    killingBlowIndex,
    dispatch,
  } = useMeatGrinderSimulation();

  const { input, effectiveChargeAttackIndex } = useActivationInput();
  const wrapExpansion = useWrapExpansion();
  const projection = useMemo(() => projectSwings(input), [input]);

  return (
    <AttacksList>
      {attacks.map((a, displayIdx) => (
        <AttackSwingRow
          key={a.attackIndex}
          attack={a}
          displayIdx={displayIdx}
          disabled={swingIsSkipped(
            displayIdx,
            ignoredAttackIndex,
            killingBlowIndex,
          )}
          isKillingBlow={displayIdx === killingBlowIndex}
          charging={charging}
          chargeAttackIndex={effectiveChargeAttackIndex}
          activeBaseCount={activeBaseCount}
          wrapPicks={wrapPicks}
          characterPlayPicks={characterPlayPicks}
          damageMods={damageMods}
          remainingHpIfHit={projection.remainingHp[displayIdx]}
          momentum={projection.momentum[displayIdx]}
          bonusTime={effectiveBonusTimeByAttack[a.attackIndex] === true}
          bonusTimeMomentumPool={projection.bonusTimePool[displayIdx]}
          onBonusTimeChange={(attackIndex, value) =>
            dispatch({ type: 'bonusTime', attackIndex, value })
          }
          wrapOpen={wrapExpansion.isOpen(a.attackIndex)}
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
          onToggleWrapExpansion={() => wrapExpansion.toggle(a.attackIndex)}
          onWrapContinuationCleared={(attackIndex) =>
            dispatch({ type: 'clearWrapContinuation', attackIndex })
          }
        />
      ))}
      <AttacksPanelSummary />
    </AttacksList>
  );
};
