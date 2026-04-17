import { useId } from 'react';
import styled from 'styled-components';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '../core/constants';
import { narrowViewport } from '../styles/breakpoints';
import { Panel, PanelTitle, Row } from './ui';
import { StepControl } from './StepControl';

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

const CoverHint = styled.span`
  display: block;
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--muted);
  line-height: 1.4;
`;

export type TargetPanelProps = {
  def: number;
  armor: number;
  hp: number;
  enemyHasCover: boolean;
  onEnemyHasCoverChange: (cover: boolean) => void;
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
  onDefChange,
  onArmorChange,
  onHpChange,
}: TargetPanelProps) {
  const coverHintId = useId();
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
          aria-describedby={coverHintId}
        />
        <span>
          <strong>Cover</strong> — enemy near terrain (−1 TAC to the pool).
          <CoverHint id={coverHintId}>
            A Push ({'>'}) on any earlier swing in this activation moves them off
            that terrain, so later swings no longer take that −1.
          </CoverHint>
        </span>
      </CoverOption>
    </Panel>
  );
}
