import type { AttackSimulation } from '../hooks/useAttackSimulation';
import { AttacksPanel } from './AttacksPanel';
import { EnemyPanel, VBoarPanel } from './TargetPanel';
import { TargetPanelsRow } from './TargetPanelsRow';

type SimulationPanelsProps = {
  sim: AttackSimulation;
};

export function SimulationPanels({ sim }: SimulationPanelsProps) {
  return (
    <>
      <TargetPanelsRow>
        <VBoarPanel
          damageMods={sim.damageMods}
          onDamageModsChange={sim.handleDamageModsChange}
          startingMomentum={sim.startingMomentum}
          onStartingMomentumChange={sim.setStartingMomentum}
          initialTacModifier={sim.initialTacModifier}
          onInitialTacModifierChange={sim.handleInitialTacModifierChange}
        />
        <EnemyPanel
          def={sim.def}
          armor={sim.armor}
          hp={sim.hp}
          enemyHasCover={sim.enemyHasCover}
          onEnemyHasCoverChange={sim.handleEnemyHasCoverChange}
          damageMods={sim.damageMods}
          onDamageModsChange={sim.handleDamageModsChange}
          onDefChange={sim.handleDefChange}
          onArmorChange={sim.handleArmorChange}
          onHpChange={sim.setHp}
        />
      </TargetPanelsRow>
      <AttacksPanel
        targetHp={sim.hp}
        armor={sim.armor}
        chargeAttackIndex={sim.chargeAttackIndex}
        onChargeAttackIndexChange={sim.handleChargeAttackIndexChange}
        startingMomentum={sim.startingMomentum}
        bonusTimeByAttack={sim.bonusTimeByAttack}
        onBonusTimeChange={sim.handleBonusTimeChange}
        wrapPicks={sim.wrapPicks}
        characterPlayPicks={sim.characterPlayPicks}
        damageMods={sim.damageMods}
        onChoiceChange={sim.setChoice}
        onCharacterPlayPickChange={sim.setCharacterPlayPick}
        onWrapContinuationCleared={sim.clearWrapContinuation}
        attacks={sim.attacks}
      />
    </>
  );
}
