import styled from 'styled-components';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '../core/constants';
import type { PlaybookDamageMods } from '../core/playbook';
import { narrowViewport } from '../styles/breakpoints';
import { StepControl } from './StepControl';
import { Panel, PanelTitle, Row } from './ui';

/*
  Previously: footnote with planned damage if all attacks hit and HP remaining
  (damagePlannedIfAllHit, attackCount). Removed from UI per request.
*/

const CoverOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.85rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  ${narrowViewport} {
    margin-top: 0.55rem;
    font-size: 0.82rem;
  }
`;

const DamageSectionTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 1rem 0 0.4rem;
`;

const ToughHideOption = styled(CoverOption)`
  margin-top: 0.5rem;
`;

const BuffOption = styled(CoverOption)`
  margin-top: 0.35rem;
`;

export type TargetPanelProps = {
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

export function TargetPanel({
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
}: TargetPanelProps) {
  return (
    <Panel>
      <PanelTitle>Target</PanelTitle>
      <Row>
        <StepControl
          label="Defense (min hit roll)"
          value={def}
          min={DEF_MIN}
          max={DEF_MAX}
          onChange={onDefChange}
          valueLabel={`${def}+`}
          decrementAriaLabel="Decrease defense threshold"
          incrementAriaLabel="Increase defense threshold"
        />
        <StepControl
          label="Armor (subtract hits)"
          value={armor}
          min={ARM_MIN}
          max={ARM_MAX}
          onChange={onArmorChange}
          valueLabel={String(armor)}
          decrementAriaLabel="Decrease armor"
          incrementAriaLabel="Increase armor"
        />
        <StepControl
          label="HP (hit points)"
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

      <DamageSectionTitle>Playbook damage</DamageSectionTitle>
      <ToughHideOption>
        <input
          type="checkbox"
          checked={damageMods.toughHide}
          onChange={(e) =>
            onDamageModsChange({ ...damageMods, toughHide: e.target.checked })
          }
        />
        <span>Tough Hide</span>
      </ToughHideOption>
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
