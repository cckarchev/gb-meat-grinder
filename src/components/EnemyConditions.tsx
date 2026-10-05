import styled from 'styled-components';
import {
  TOOLTIP_COVER,
  TOOLTIP_DEFENSIVE_STANCE,
  TOOLTIP_KNOCKED_DOWN,
  TOOLTIP_RESILIENCE,
  TOOLTIP_SNARED,
  TOOLTIP_TOUGH_HIDE,
} from '@/components/enemyPanelCopy';
import { TooltipCheckbox } from '@/components/TooltipCheckbox';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';

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

/** Conditions the target starts the activation with. */
export const EnemyConditions = () => {
  const {
    enemyHasCover,
    enemyDefensiveStance,
    enemyKnockedDown,
    enemySnared,
    enemyResilience,
    damageMods,
    dispatch,
  } = useMeatGrinderSimulation();

  return (
    <ConditionsSection>
      <ConditionsGrid>
        <ConditionsColumn>
          <TooltipCheckbox
            checked={enemyHasCover}
            onChange={(value) => dispatch({ type: 'enemyHasCover', value })}
            tooltip={TOOLTIP_COVER}
          >
            Cover
          </TooltipCheckbox>
          <TooltipCheckbox
            checked={enemyDefensiveStance}
            onChange={(value) =>
              dispatch({ type: 'enemyDefensiveStance', value })
            }
            tooltip={TOOLTIP_DEFENSIVE_STANCE}
          >
            Defensive Stance
          </TooltipCheckbox>
          <TooltipCheckbox
            checked={damageMods.toughHide}
            onChange={(toughHide) =>
              dispatch({
                type: 'damageMods',
                value: { ...damageMods, toughHide },
              })
            }
            tooltip={TOOLTIP_TOUGH_HIDE}
          >
            Tough Hide
          </TooltipCheckbox>
        </ConditionsColumn>
        <ConditionsColumn>
          <TooltipCheckbox
            checked={enemyKnockedDown}
            onChange={(value) => dispatch({ type: 'enemyKnockedDown', value })}
            tooltip={TOOLTIP_KNOCKED_DOWN}
          >
            Knocked Down (-1 DEF)
          </TooltipCheckbox>
          <TooltipCheckbox
            checked={enemySnared}
            onChange={(value) => dispatch({ type: 'enemySnared', value })}
            tooltip={TOOLTIP_SNARED}
          >
            Snared (-1 DEF)
          </TooltipCheckbox>
          <TooltipCheckbox
            checked={enemyResilience}
            onChange={(value) => dispatch({ type: 'enemyResilience', value })}
            tooltip={TOOLTIP_RESILIENCE}
          >
            Resilience
          </TooltipCheckbox>
        </ConditionsColumn>
      </ConditionsGrid>
    </ConditionsSection>
  );
};
