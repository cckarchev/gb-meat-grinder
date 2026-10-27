import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import { ToggleGroup } from "@/ui/toggle-group/ToggleGroup";
import { TooltipCheckbox } from "@/ui/tooltip-checkbox/TooltipCheckbox";
import {
  LABEL_COVER,
  LABEL_DEFENSES,
  LABEL_DEFENSIVE_STANCE,
  LABEL_RESILIENCE,
  LABEL_TOUGH_HIDE,
  TOOLTIP_COVER,
  TOOLTIP_DEFENSIVE_STANCE,
  TOOLTIP_RESILIENCE,
  TOOLTIP_TOUGH_HIDE,
} from "./panelCopy";

/** What protects the target: its position, its stance and its own traits. */
export const Defenses = () => {
  const {
    enemyHasCover,
    enemyDefensiveStance,
    enemyResilience,
    damageMods,
    dispatch,
  } = useMeatGrinderSimulation();

  return (
    <ToggleGroup title={LABEL_DEFENSES}>
      <TooltipCheckbox
        checked={enemyHasCover}
        onChange={(value) => dispatch({ type: "enemyHasCover", value })}
        tooltip={TOOLTIP_COVER}
      >
        {LABEL_COVER}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemyDefensiveStance}
        onChange={(value) => dispatch({ type: "enemyDefensiveStance", value })}
        tooltip={TOOLTIP_DEFENSIVE_STANCE}
      >
        {LABEL_DEFENSIVE_STANCE}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={damageMods.toughHide}
        onChange={(value) => dispatch({ type: "toughHide", value })}
        tooltip={TOOLTIP_TOUGH_HIDE}
      >
        {LABEL_TOUGH_HIDE}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemyResilience}
        onChange={(value) => dispatch({ type: "enemyResilience", value })}
        tooltip={TOOLTIP_RESILIENCE}
      >
        {LABEL_RESILIENCE}
      </TooltipCheckbox>
    </ToggleGroup>
  );
};
