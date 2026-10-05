import { EnemyConditions } from '@/components/enemy/EnemyConditions';
import { EnemyDefenses } from '@/components/enemy/EnemyDefenses';
import { EnemyGuildDebuffs } from '@/components/enemy/EnemyGuildDebuffs';
import styles from '@/components/enemy/EnemyPanel.module.css';
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

export const EnemyPanel = () => {
  const { enemyDef, armor, hp, dispatch } = useMeatGrinderSimulation();

  return (
    <Panel className={styles.enemyPanel}>
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
      <PanelFooterSection className={styles.toggles}>
        <ToggleGroupStack>
          <ToggleGroupPair>
            <EnemyConditions />
            <EnemyDefenses />
          </ToggleGroupPair>
          <EnemyGuildDebuffs />
        </ToggleGroupStack>
      </PanelFooterSection>
    </Panel>
  );
};
