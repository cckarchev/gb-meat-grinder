import { useMemo } from 'react';
import styled from 'styled-components';
import { AttackSwingRow } from '@/components/attacks/AttackSwingRow';
import { AttacksPanelSummary } from '@/components/attacks/AttacksPanelSummary';
import { useWrapExpansion } from '@/components/attacks/useWrapExpansion';
import { NO_ATTACK_INDEX } from '@/core/constants';
import { projectSwings } from '@/core/swingProjections';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const AttacksPanel = () => {
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
    effectiveBonusTimeByAttack,
    ignoredAttackIndex,
    damageMods,
    specialAbilities,
    attacks,
    killingBlowIndex,
    dispatch,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging
    ? chargeAttackIndex
    : NO_ATTACK_INDEX;
  const wrapExpansion = useWrapExpansion();

  const projection = useMemo(
    () =>
      projectSwings({
        attacker,
        attacks,
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

  const isSwingDisabled = (displayIdx: number): boolean => {
    const ignored = displayIdx === ignoredAttackIndex;
    const afterKill = killingBlowIndex >= 0 && displayIdx > killingBlowIndex;

    return ignored || afterKill;
  };

  return (
    <AttacksList>
      {attacks.map((a, displayIdx) => (
        <AttackSwingRow
          key={a.attackIndex}
          attack={a}
          displayIdx={displayIdx}
          disabled={isSwingDisabled(displayIdx)}
          isKillingBlow={displayIdx === killingBlowIndex}
          armor={a.armor}
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
