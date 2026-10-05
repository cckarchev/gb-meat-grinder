import styled from 'styled-components';
import { EnemyConditions } from '@/components/enemy/EnemyConditions';
import { EnemyDefenses } from '@/components/enemy/EnemyDefenses';
import { EnemyGuildDebuffs } from '@/components/enemy/EnemyGuildDebuffs';
import { StepControl } from '@/components/ui/StepControl';
import { ToggleGroupPair, ToggleGroupStack } from '@/components/ui/ToggleGroup';
import { Panel, PanelFooterSection, PanelTitle, Row } from '@/components/ui/ui';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Stretch to the row height so the toggles can sit at the bottom. */
const EnemyPanelBox = styled(Panel)`
  display: flex;
  flex-direction: column;
`;

/**
 * Pre-attack toggles: a rule separates them from the stat steppers, and
 * `margin-top: auto` pins them to the bottom so they align with the attacker
 * panel's toggles in the same row.
 */
const EnemyToggles = styled(PanelFooterSection)`
  margin-top: auto;
`;

export const EnemyPanel = () => {
  const { enemyDef, armor, hp, dispatch } = useMeatGrinderSimulation();

  return (
    <EnemyPanelBox>
      <PanelTitle>Enemy</PanelTitle>
      <Row>
        <StepControl
          label="Defense"
          value={enemyDef}
          min={DEF_MIN}
          max={DEF_MAX}
          onChange={(value) => dispatch({ type: 'enemyDef', value })}
          valueLabel={`${enemyDef}+`}
          ariaSubject="defense threshold"
        />
        <StepControl
          label="Armor"
          value={armor}
          min={ARM_MIN}
          max={ARM_MAX}
          onChange={(value) => dispatch({ type: 'armor', value })}
          ariaSubject="armor"
        />
        <StepControl
          label="HP"
          value={hp}
          min={HP_MIN}
          max={HP_MAX}
          onChange={(value) => dispatch({ type: 'hp', value })}
          ariaSubject="target HP"
        />
      </Row>
      <EnemyToggles>
        <ToggleGroupStack>
          <ToggleGroupPair>
            <EnemyConditions />
            <EnemyDefenses />
          </ToggleGroupPair>
          <EnemyGuildDebuffs />
        </ToggleGroupStack>
      </EnemyToggles>
    </EnemyPanelBox>
  );
};
