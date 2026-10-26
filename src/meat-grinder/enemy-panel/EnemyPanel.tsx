import {
  ARM_MAX,
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  HP_MAX,
  HP_MIN,
} from "@/core/shared/constants";
import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import { StepControl } from "@/ui/step-control/StepControl";
import {
  ToggleGroupPair,
  ToggleGroupStack,
} from "@/ui/toggle-group/ToggleGroup";
import { Panel, PanelFooterSection, PanelTitle, Row } from "@/ui/ui";
import { Conditions } from "./Conditions";
import { Defenses } from "./Defenses";
import styles from "./EnemyPanel.module.css";
import { GuildDebuffs } from "./GuildDebuffs";

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
          onChange={(value) => dispatch({ type: "enemyDef", value })}
          valueLabel={`${enemyDef}+`}
          ariaSubject="defense threshold"
        />
        <StepControl
          label="Armor"
          value={armor}
          min={ARM_MIN}
          max={ARM_MAX}
          onChange={(value) => dispatch({ type: "armor", value })}
          ariaSubject="armor"
        />
        <StepControl
          label="HP"
          value={hp}
          min={HP_MIN}
          max={HP_MAX}
          onChange={(value) => dispatch({ type: "hp", value })}
          ariaSubject="target HP"
        />
      </Row>
      <PanelFooterSection className={styles.toggles}>
        <ToggleGroupStack>
          <ToggleGroupPair>
            <Conditions />
            <Defenses />
          </ToggleGroupPair>
          <GuildDebuffs />
        </ToggleGroupStack>
      </PanelFooterSection>
    </Panel>
  );
};
