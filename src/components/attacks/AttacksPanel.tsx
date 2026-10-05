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
    effectiveChargeAttackIndex,
    effectiveBonusTimeByAttack,
    ignoredDisplayIndex,
    attacks,
    killingBlowIndex,
  } = useMeatGrinderSimulation();

  const input = useActivationInput();
  const wrapExpansion = useWrapExpansion();
  const projection = useMemo(() => projectSwings(input), [input]);

  return (
    <AttacksList>
      {attacks.map((attack, displayIndex) => (
        <AttackSwingRow
          key={attack.attackIndex}
          attack={attack}
          displayIndex={displayIndex}
          disabled={swingIsSkipped(
            displayIndex,
            ignoredDisplayIndex,
            killingBlowIndex,
          )}
          isKillingBlow={displayIndex === killingBlowIndex}
          chargeAttackIndex={effectiveChargeAttackIndex}
          remainingHpIfHit={projection.remainingHp[displayIndex]}
          momentum={projection.momentum[displayIndex]}
          bonusTime={effectiveBonusTimeByAttack[attack.attackIndex] === true}
          bonusTimeMomentumPool={projection.bonusTimePool[displayIndex]}
          wrapOpen={wrapExpansion.isOpen(attack.attackIndex)}
          onToggleWrapExpansion={() => wrapExpansion.toggle(attack.attackIndex)}
        />
      ))}
      <AttacksPanelSummary />
    </AttacksList>
  );
};
