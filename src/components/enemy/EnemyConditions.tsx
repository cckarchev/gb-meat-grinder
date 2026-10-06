import {
  LABEL_CONDITIONS,
  LABEL_KNOCKED_DOWN,
  LABEL_SNARED,
  labelAssistEngaged,
  TOOLTIP_BURNING,
  TOOLTIP_KNOCKED_DOWN,
  TOOLTIP_SNARED,
  tooltipAssistEngaged,
} from '@/components/enemy/enemyPanelCopy';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { assistNamedModels } from '@/core/characterPlays/characterPlayEffects';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Game conditions the target starts the activation with. */
export const EnemyConditions = () => {
  const { attacker, enemyKnockedDown, enemySnared, damageMods, dispatch } =
    useMeatGrinderSimulation();

  const assistNamed = assistNamedModels(attacker);
  const hasAssist = assistNamed.length > 0;

  return (
    <ToggleGroup title={LABEL_CONDITIONS}>
      <TooltipCheckbox
        checked={enemyKnockedDown}
        onChange={(value) => dispatch({ type: 'enemyKnockedDown', value })}
        tooltip={TOOLTIP_KNOCKED_DOWN}
      >
        {LABEL_KNOCKED_DOWN}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={enemySnared}
        onChange={(value) => dispatch({ type: 'enemySnared', value })}
        tooltip={TOOLTIP_SNARED}
      >
        {LABEL_SNARED}
      </TooltipCheckbox>
      <TooltipCheckbox
        checked={damageMods.targetBurning}
        onChange={(value) => dispatch({ type: 'targetBurning', value })}
        tooltip={TOOLTIP_BURNING}
      >
        Burning
      </TooltipCheckbox>
      {hasAssist && (
        <TooltipCheckbox
          checked={damageMods.assistEngaged}
          onChange={(value) => dispatch({ type: 'assistEngaged', value })}
          tooltip={tooltipAssistEngaged(assistNamed)}
        >
          {labelAssistEngaged(assistNamed)}
        </TooltipCheckbox>
      )}
    </ToggleGroup>
  );
};
