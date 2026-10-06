import { useMemo } from 'react';
import styles from '@/components/attacks/AttacksPanel.module.css';
import { useWrapExpansion } from '@/components/attacks/playbook/useWrapExpansion';
import { AttacksPanelSummary } from '@/components/attacks/summary/AttacksPanelSummary';
import { AttackSwingRow } from '@/components/attacks/swing/AttackSwingRow';
import { useActivationInput } from '@/components/attacks/useActivationInput';
import { swingIsSkipped } from '@/core/activation/summary/activationSummary';
import { statTransitions } from '@/core/attacks/statTransitions';
import { projectSwings } from '@/core/attacks/swingProjections';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

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

  const hpTransitions = statTransitions(
    projection.remainingHp,
    projection.startingHp,
  );
  const defTransitions = statTransitions(
    attacks.map((attack) => attack.defMinRoll),
  );
  const armorTransitions = statTransitions(
    attacks.map((attack) => attack.armor),
  );

  return (
    <div className={styles.attacksList}>
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
          hp={hpTransitions[displayIndex]}
          def={defTransitions[displayIndex]}
          armor={armorTransitions[displayIndex]}
          momentum={projection.momentum[displayIndex]}
          bonusTime={effectiveBonusTimeByAttack[attack.attackIndex] === true}
          bonusTimeMomentumPool={projection.bonusTimePool[displayIndex]}
          wrapOpen={wrapExpansion.isOpen(attack.attackIndex)}
          onToggleWrapExpansion={() => wrapExpansion.toggle(attack.attackIndex)}
        />
      ))}
      <AttacksPanelSummary />
    </div>
  );
};
