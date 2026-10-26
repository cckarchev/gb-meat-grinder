import { useMemo } from "react";
import { swingIsSkipped } from "@/core/activation/summary/activationSummary";
import { statTransitions } from "@/core/attacks/statTransitions";
import { projectSwings } from "@/core/attacks/swingProjections";
import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import styles from "./AttacksPanel.module.css";
import { Summary } from "./summary/Summary";
import { SwingRow } from "./swing-row/SwingRow";
import { useActivationInput } from "./useActivationInput";
import { useWrapExpansion } from "./useWrapExpansion";

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
  const momentumTransitions = statTransitions(
    projection.momentum,
    input.startingMomentum,
  );

  return (
    <div className={styles.attacksList}>
      {attacks.map((attack, displayIndex) => (
        <SwingRow
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
          momentum={momentumTransitions[displayIndex]}
          bonusTime={effectiveBonusTimeByAttack[attack.attackIndex] === true}
          bonusTimeMomentumPool={projection.bonusTimePool[displayIndex]}
          wrapOpen={wrapExpansion.isOpen(attack.attackIndex)}
          onToggleWrapExpansion={() => wrapExpansion.toggle(attack.attackIndex)}
        />
      ))}
      <Summary />
    </div>
  );
};
