import styled from 'styled-components';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
  INITIAL_TAC_MODIFIER_MAX,
  INITIAL_TAC_MODIFIER_MIN,
  STARTING_MOMENTUM_MAX,
  STARTING_MOMENTUM_MIN,
} from '../core/constants';
import type { PlaybookDamageMods } from '../core/playbook';
import { narrowViewport } from '../styles/breakpoints';
import { StepControl } from './StepControl';
import { Panel, PanelTitle, Row } from './ui';

const CoverOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.5rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  ${narrowViewport} {
    margin-top: 0.4rem;
    font-size: 0.82rem;
  }
`;

const BuffOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.35rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  ${narrowViewport} {
    font-size: 0.82rem;
  }
`;

export type EnemyPanelProps = {
  def: number;
  armor: number;
  hp: number;
  enemyHasCover: boolean;
  onEnemyHasCoverChange: (cover: boolean) => void;
  damageMods: PlaybookDamageMods;
  onDamageModsChange: (mods: PlaybookDamageMods) => void;
  onDefChange: (def: number) => void;
  onArmorChange: (armor: number) => void;
  onHpChange: (hp: number) => void;
};

export function EnemyPanel({
  def,
  armor,
  hp,
  enemyHasCover,
  onEnemyHasCoverChange,
  damageMods,
  onDamageModsChange,
  onDefChange,
  onArmorChange,
  onHpChange,
}: EnemyPanelProps) {
  return (
    <Panel>
      <PanelTitle>Enemy</PanelTitle>
      <Row>
        <StepControl
          label="Defense"
          value={def}
          min={DEF_MIN}
          max={DEF_MAX}
          onChange={onDefChange}
          valueLabel={`${def}+`}
          decrementAriaLabel="Decrease defense threshold"
          incrementAriaLabel="Increase defense threshold"
        />
        <StepControl
          label="Armor"
          value={armor}
          min={ARM_MIN}
          max={ARM_MAX}
          onChange={onArmorChange}
          valueLabel={String(armor)}
          decrementAriaLabel="Decrease armor"
          incrementAriaLabel="Increase armor"
        />
        <StepControl
          label="HP"
          value={hp}
          min={HP_MIN}
          max={HP_MAX}
          onChange={onHpChange}
          valueLabel={String(hp)}
          decrementAriaLabel="Decrease target HP"
          incrementAriaLabel="Increase target HP"
        />
      </Row>
      <CoverOption>
        <input
          type="checkbox"
          checked={enemyHasCover}
          onChange={(e) => onEnemyHasCoverChange(e.target.checked)}
        />
        <span>Cover</span>
      </CoverOption>
      <BuffOption>
        <input
          type="checkbox"
          checked={damageMods.toughHide}
          onChange={(e) =>
            onDamageModsChange({ ...damageMods, toughHide: e.target.checked })
          }
        />
        <span>Tough Hide</span>
      </BuffOption>
    </Panel>
  );
}

export type VBoarPanelProps = {
  damageMods: PlaybookDamageMods;
  onDamageModsChange: (mods: PlaybookDamageMods) => void;
  startingMomentum: number;
  onStartingMomentumChange: (value: number) => void;
  initialTacModifier: number;
  onInitialTacModifierChange: (value: number) => void;
};

export function VBoarPanel({
  damageMods,
  onDamageModsChange,
  startingMomentum,
  onStartingMomentumChange,
  initialTacModifier,
  onInitialTacModifierChange,
}: VBoarPanelProps) {
  const tacModLabel =
    initialTacModifier > 0
      ? `+${initialTacModifier}`
      : String(initialTacModifier);

  return (
    <Panel>
      <PanelTitle>Veteran Boar</PanelTitle>
      <Row>
        <StepControl
          label="Starting momentum"
          value={startingMomentum}
          min={STARTING_MOMENTUM_MIN}
          max={STARTING_MOMENTUM_MAX}
          onChange={onStartingMomentumChange}
          valueLabel={String(startingMomentum)}
          decrementAriaLabel="Decrease starting momentum"
          incrementAriaLabel="Increase starting momentum"
        />
        <StepControl
          label="Initial TAC modifier"
          value={initialTacModifier}
          min={INITIAL_TAC_MODIFIER_MIN}
          max={INITIAL_TAC_MODIFIER_MAX}
          onChange={onInitialTacModifierChange}
          valueLabel={tacModLabel}
          decrementAriaLabel="Decrease initial TAC modifier"
          incrementAriaLabel="Increase initial TAC modifier"
        />
      </Row>
      <BuffOption>
        <input
          type="checkbox"
          checked={damageMods.tooledUp}
          onChange={(e) =>
            onDamageModsChange({ ...damageMods, tooledUp: e.target.checked })
          }
        />
        <span>Tooled Up</span>
      </BuffOption>
      <BuffOption>
        <input
          type="checkbox"
          checked={damageMods.theOwner}
          onChange={(e) =>
            onDamageModsChange({ ...damageMods, theOwner: e.target.checked })
          }
        />
        <span>The Owner</span>
      </BuffOption>
    </Panel>
  );
}
