import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '../core/constants';
import { Panel, PanelTitle, Row } from './ui';
import { StepControl } from './StepControl';

/*
  Previously: footnote with planned damage if all attacks hit and HP remaining
  (damagePlannedIfAllHit, attackCount). Removed from UI per request.
*/

export type TargetPanelProps = {
  def: number;
  armor: number;
  hp: number;
  onDefChange: (def: number) => void;
  onArmorChange: (armor: number) => void;
  onHpChange: (hp: number) => void;
};

export function TargetPanel({
  def,
  armor,
  hp,
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
    </Panel>
  );
}
