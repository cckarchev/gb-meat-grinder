import styled from 'styled-components';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '@/core/constants';
import { useMeatGrinderSimulation } from '@/meatGrinder/useMeatGrinderSimulation';
import { narrowViewport } from '@/styles/breakpoints';
import { StepControl } from '@/components/StepControl';
import { BuffOption } from '@/components/targetPanelPrimitives';
import { Panel, PanelTitle, Row } from '@/components/ui';

const TOOLTIP_COVER =
  'Terrain: attacks that still count as in cover take -1 TAC. An earlier > or >> in this activation can clear cover for later swings.';

const TOOLTIP_DEFENSIVE_STANCE =
  'On the charge attack only, the model counts as +1 DEF on its hit roll (still capped at the normal DEF maximum).';

const TOOLTIP_TOUGH_HIDE =
  '-1 to damage on each selected playbook line that has card damage (can reduce a pip to 0).';

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

export function EnemyPanel() {
  const {
    enemyDef,
    armor,
    hp,
    enemyHasCover,
    enemyDefensiveStance,
    damageMods,
    dispatch,
  } = useMeatGrinderSimulation();

  return (
    <Panel>
      <PanelTitle>Enemy</PanelTitle>
      <Row>
        <StepControl
          label="Defense"
          value={enemyDef}
          min={DEF_MIN}
          max={DEF_MAX}
          onChange={(v) => dispatch({ type: 'enemyDef', value: v })}
          valueLabel={`${enemyDef}+`}
          decrementAriaLabel="Decrease defense threshold"
          incrementAriaLabel="Increase defense threshold"
        />
        <StepControl
          label="Armor"
          value={armor}
          min={ARM_MIN}
          max={ARM_MAX}
          onChange={(v) => dispatch({ type: 'armor', value: v })}
          valueLabel={String(armor)}
          decrementAriaLabel="Decrease armor"
          incrementAriaLabel="Increase armor"
        />
        <StepControl
          label="HP"
          value={hp}
          min={HP_MIN}
          max={HP_MAX}
          onChange={(v) => dispatch({ type: 'hp', value: v })}
          valueLabel={String(hp)}
          decrementAriaLabel="Decrease target HP"
          incrementAriaLabel="Increase target HP"
        />
      </Row>
      <CoverOption title={TOOLTIP_COVER}>
        <input
          type="checkbox"
          checked={enemyHasCover}
          onChange={(e) =>
            dispatch({ type: 'enemyHasCover', value: e.target.checked })
          }
        />
        <span>Cover</span>
      </CoverOption>
      <CoverOption title={TOOLTIP_DEFENSIVE_STANCE}>
        <input
          type="checkbox"
          checked={enemyDefensiveStance}
          onChange={(e) =>
            dispatch({
              type: 'enemyDefensiveStance',
              value: e.target.checked,
            })
          }
        />
        <span>Defensive Stance</span>
      </CoverOption>
      <BuffOption title={TOOLTIP_TOUGH_HIDE}>
        <input
          type="checkbox"
          checked={damageMods.toughHide}
          onChange={(e) =>
            dispatch({
              type: 'damageMods',
              value: { ...damageMods, toughHide: e.target.checked },
            })
          }
        />
        <span>Tough Hide</span>
      </BuffOption>
    </Panel>
  );
}
