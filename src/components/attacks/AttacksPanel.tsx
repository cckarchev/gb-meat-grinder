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
    effectiveBonusTimeByAttack,
    ignoredDisplayIndex,
    attacks,
    killingBlowIndex,
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
            ignoredDisplayIndex,
            killingBlowIndex,
          )}
          isKillingBlow={displayIdx === killingBlowIndex}
          chargeAttackIndex={effectiveChargeAttackIndex}
          remainingHpIfHit={projection.remainingHp[displayIdx]}
          momentum={projection.momentum[displayIdx]}
          bonusTime={effectiveBonusTimeByAttack[a.attackIndex] === true}
          bonusTimeMomentumPool={projection.bonusTimePool[displayIdx]}
          wrapOpen={wrapExpansion.isOpen(a.attackIndex)}
          onToggleWrapExpansion={() => wrapExpansion.toggle(a.attackIndex)}
        />
      ))}
      <AttacksPanelSummary />
    </AttacksList>
  );
};
