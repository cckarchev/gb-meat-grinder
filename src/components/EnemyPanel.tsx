import styled from 'styled-components';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '@/core/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import { StepControl } from '@/components/StepControl';
import { CheckOption } from '@/components/targetPanelPrimitives';
import { InfoTip } from '@/components/InfoTip';
import { Panel, PanelTitle, Row } from '@/components/ui';

/** Stretch to the row height so the conditions can sit at the bottom. */
const EnemyPanelBox = styled(Panel)`
  display: flex;
  flex-direction: column;
`;

/**
 * Pre-attack conditions: a rule separates them from the stat steppers, and
 * `margin-top: auto` pins the group to the bottom so it aligns with the
 * attacker panel's toggles in the same row.
 */
const ConditionsSection = styled.div`
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);

  ${narrowViewport} {
    padding-top: 0.6rem;
  }
`;

/** Cover/Defensive Stance/Tough Hide on the left, KD/Snared on the right. */
const ConditionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1rem;
  align-items: start;

  ${narrowViewport} {
    gap: 0 0.55rem;
  }

  ${extraNarrowViewport} {
    grid-template-columns: 1fr;
  }

  > div > label:first-child {
    margin-top: 0;
  }
`;

const ConditionsColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const TOOLTIP_COVER =
  'Terrain: attacks that still count as in cover take -1 TAC. An earlier > or >> in this activation can clear cover for later swings.';

const TOOLTIP_DEFENSIVE_STANCE =
  'On the charge attack only, the model counts as +1 DEF on its hit roll (still capped at the normal DEF maximum).';

const TOOLTIP_TOUGH_HIDE =
  '-1 to damage on each selected playbook line that has card damage (can reduce a pip to 0).';

const TOOLTIP_KNOCKED_DOWN =
  'Target starts the activation Knocked Down: -1 DEF. Only one KD can apply, so the playbook KD is disabled.';

const TOOLTIP_SNARED = 'Target starts the activation Snared: -1 DEF.';

export function EnemyPanel() {
  const {
    enemyDef,
    armor,
    hp,
    enemyHasCover,
    enemyDefensiveStance,
    enemyKnockedDown,
    enemySnared,
    damageMods,
    dispatch,
  } = useMeatGrinderSimulation();

  return (
    <EnemyPanelBox>
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
      <ConditionsSection>
        <ConditionsGrid>
          <ConditionsColumn>
            <CheckOption>
              <input
                type="checkbox"
                checked={enemyHasCover}
                onChange={(e) =>
                  dispatch({ type: 'enemyHasCover', value: e.target.checked })
                }
              />
              <span>
                <InfoTip content={TOOLTIP_COVER}>Cover</InfoTip>
              </span>
            </CheckOption>
            <CheckOption>
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
              <span>
                <InfoTip content={TOOLTIP_DEFENSIVE_STANCE}>
                  Defensive Stance
                </InfoTip>
              </span>
            </CheckOption>
            <CheckOption>
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
              <span>
                <InfoTip content={TOOLTIP_TOUGH_HIDE}>Tough Hide</InfoTip>
              </span>
            </CheckOption>
          </ConditionsColumn>
          <ConditionsColumn>
            <CheckOption>
              <input
                type="checkbox"
                checked={enemyKnockedDown}
                onChange={(e) =>
                  dispatch({ type: 'enemyKnockedDown', value: e.target.checked })
                }
              />
              <span>
                <InfoTip content={TOOLTIP_KNOCKED_DOWN}>
                  Knocked Down (-1 DEF)
                </InfoTip>
              </span>
            </CheckOption>
            <CheckOption>
              <input
                type="checkbox"
                checked={enemySnared}
                onChange={(e) =>
                  dispatch({ type: 'enemySnared', value: e.target.checked })
                }
              />
              <span>
                <InfoTip content={TOOLTIP_SNARED}>Snared (-1 DEF)</InfoTip>
              </span>
            </CheckOption>
          </ConditionsColumn>
        </ConditionsGrid>
      </ConditionsSection>
    </EnemyPanelBox>
  );
}
