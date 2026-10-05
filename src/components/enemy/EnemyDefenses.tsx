import {
  LABEL_DEFENSES,
  TOOLTIP_COVER,
  TOOLTIP_DEFENSIVE_STANCE,
  TOOLTIP_RESILIENCE,
  TOOLTIP_TOUGH_HIDE,
} from '@/components/enemy/enemyPanelCopy';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** What protects the target: its position, its stance and its own traits. */
export const EnemyDefenses = () => {
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
        onChange={(value) => dispatch({ type: 'enemyHasCover', value })}
        tooltip={TOOLTIP_COVER}
      >
        Cover
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemyDefensiveStance}
        onChange={(value) => dispatch({ type: 'enemyDefensiveStance', value })}
        tooltip={TOOLTIP_DEFENSIVE_STANCE}
      >
        Defensive Stance
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={damageMods.toughHide}
        onChange={(value) => dispatch({ type: 'toughHide', value })}
        tooltip={TOOLTIP_TOUGH_HIDE}
      >
        Tough Hide
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemyResilience}
        onChange={(value) => dispatch({ type: 'enemyResilience', value })}
        tooltip={TOOLTIP_RESILIENCE}
      >
        Resilience
      </TooltipCheckbox>
    </ToggleGroup>
  );
};
