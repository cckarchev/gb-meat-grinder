import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import { ToggleGroup } from "@/ui/toggle-group/ToggleGroup";
import { TooltipCheckbox } from "@/ui/tooltip-checkbox/TooltipCheckbox";
import {
  LABEL_BURNING,
  LABEL_CONDITIONS,
  LABEL_KNOCKED_DOWN,
  LABEL_SNARED,
  TOOLTIP_BURNING,
  TOOLTIP_KNOCKED_DOWN,
  TOOLTIP_SNARED,
} from "./panelCopy";

/** Game conditions the target starts the activation with. */
export const Conditions = () => {
  const { enemyKnockedDown, enemySnared, damageMods, dispatch } =
    useMeatGrinderSimulation();

  return (
    <ToggleGroup title={LABEL_CONDITIONS}>
      <TooltipCheckbox
        checked={enemyKnockedDown}
        onChange={(value) => dispatch({ type: "enemyKnockedDown", value })}
        tooltip={TOOLTIP_KNOCKED_DOWN}
      >
        {LABEL_KNOCKED_DOWN}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemySnared}
        onChange={(value) => dispatch({ type: "enemySnared", value })}
        tooltip={TOOLTIP_SNARED}
      >
        {LABEL_SNARED}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={damageMods.targetBurning}
        onChange={(value) => dispatch({ type: "targetBurning", value })}
        tooltip={TOOLTIP_BURNING}
      >
        {LABEL_BURNING}
      </TooltipCheckbox>
    </ToggleGroup>
  );
};
