import styled from 'styled-components';
import { EnemyConditions } from '@/components/enemy/EnemyConditions';
import { StepControl } from '@/components/ui/StepControl';
import { Panel, PanelTitle, Row } from '@/components/ui/ui';
import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Stretch to the row height so the conditions can sit at the bottom. */
const EnemyPanelBox = styled(Panel)`
  display: flex;
  flex-direction: column;
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
      <EnemyConditions />
    </EnemyPanelBox>
  );
};
