import {
  INITIAL_TAC_MODIFIER_MAX,
  INITIAL_TAC_MODIFIER_MIN,
  STARTING_MOMENTUM_MAX,
  STARTING_MOMENTUM_MIN,
} from '@/core/constants';
import { useMeatGrinderSimulation } from '@/meatGrinder/useMeatGrinderSimulation';
import { StepControl } from '@/components/StepControl';
import { BuffOption } from '@/components/targetPanelPrimitives';
import { Panel, PanelTitle, Row } from '@/components/ui';

const TOOLTIP_TOOLED_UP =
  '+1 damage on each selected playbook line damage result.';

const TOOLTIP_THE_OWNER =
  '+1 damage on each selected playbook line damage result.';

export function VBoarPanel() {
  const { damageMods, startingMomentum, initialTacModifier, dispatch } =
    useMeatGrinderSimulation();

  const tacModLabel =
    initialTacModifier > 0
      ? `+${initialTacModifier}`
      : String(initialTacModifier);

  return (
    <Panel>
      <PanelTitle>Veteran Boar</PanelTitle>
      <Row>
        <StepControl
          label="Starting momentum"
          value={startingMomentum}
          min={STARTING_MOMENTUM_MIN}
          max={STARTING_MOMENTUM_MAX}
          onChange={(v) => dispatch({ type: 'startingMomentum', value: v })}
          valueLabel={String(startingMomentum)}
          decrementAriaLabel="Decrease starting momentum"
          incrementAriaLabel="Increase starting momentum"
        />
        <StepControl
          label="Initial TAC modifier"
          value={initialTacModifier}
          min={INITIAL_TAC_MODIFIER_MIN}
          max={INITIAL_TAC_MODIFIER_MAX}
          onChange={(v) =>
            dispatch({ type: 'initialTacModifierRaw', value: v })
          }
          valueLabel={tacModLabel}
          decrementAriaLabel="Decrease initial TAC modifier"
          incrementAriaLabel="Increase initial TAC modifier"
        />
      </Row>
      <BuffOption title={TOOLTIP_TOOLED_UP}>
        <input
          type="checkbox"
          checked={damageMods.tooledUp}
          onChange={(e) =>
            dispatch({
              type: 'damageMods',
              value: { ...damageMods, tooledUp: e.target.checked },
            })
          }
        />
        <span>Tooled Up</span>
      </BuffOption>
      <BuffOption title={TOOLTIP_THE_OWNER}>
        <input
          type="checkbox"
          checked={damageMods.theOwner}
          onChange={(e) =>
            dispatch({
              type: 'damageMods',
              value: { ...damageMods, theOwner: e.target.checked },
            })
          }
        />
        <span>The Owner</span>
      </BuffOption>
    </Panel>
  );
}
