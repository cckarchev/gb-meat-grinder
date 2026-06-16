import { activeAttacker } from '@/attackers/activeAttacker';
import { useMeatGrinderSimulation } from '@/meatGrinder/useMeatGrinderSimulation';
import { StepControl } from '@/components/StepControl';
import { BuffOption } from '@/components/targetPanelPrimitives';
import { Panel, PanelTitle, Row } from '@/components/ui';

export function AttackerPanel() {
  const {
    damageMods,
    startingMomentum,
    initialTacModifier,
    influence,
    charging,
    dispatch,
  } = useMeatGrinderSimulation();

  const tacModLabel =
    initialTacModifier > 0
      ? `+${initialTacModifier}`
      : String(initialTacModifier);

  return (
    <Panel>
      <PanelTitle>{activeAttacker.name}</PanelTitle>
      <Row>
        <StepControl
          label="Influence"
          value={influence}
          min={0}
          max={activeAttacker.inf}
          onChange={(v) => dispatch({ type: 'influence', value: v })}
          valueLabel={String(influence)}
          decrementAriaLabel="Decrease influence"
          incrementAriaLabel="Increase influence"
        />
        <StepControl
          label="Starting momentum"
          value={startingMomentum}
          min={activeAttacker.startingMomentum.min}
          max={activeAttacker.startingMomentum.max}
          onChange={(v) => dispatch({ type: 'startingMomentum', value: v })}
          valueLabel={String(startingMomentum)}
          decrementAriaLabel="Decrease starting momentum"
          incrementAriaLabel="Increase starting momentum"
        />
        <StepControl
          label="Initial TAC modifier"
          value={initialTacModifier}
          min={activeAttacker.initialTacModifier.min}
          max={activeAttacker.initialTacModifier.max}
          onChange={(v) =>
            dispatch({ type: 'initialTacModifierRaw', value: v })
          }
          valueLabel={tacModLabel}
          decrementAriaLabel="Decrease initial TAC modifier"
          incrementAriaLabel="Increase initial TAC modifier"
        />
      </Row>
      <BuffOption
        title={
          activeAttacker.furious
            ? 'Charge this activation (free for Furious).'
            : 'Charge this activation (costs 2 influence).'
        }
      >
        <input
          type="checkbox"
          checked={charging}
          onChange={(e) => dispatch({ type: 'charging', value: e.target.checked })}
        />
        <span>
          Charging{activeAttacker.furious ? ' (free)' : ' (-2 influence)'}
        </span>
      </BuffOption>
      {activeAttacker.damageBuffs.map((buff) => (
        <BuffOption key={buff.id} title={buff.tooltip}>
          <input
            type="checkbox"
            checked={damageMods.buffs[buff.id] === true}
            onChange={(e) =>
              dispatch({
                type: 'damageMods',
                value: {
                  ...damageMods,
                  buffs: { ...damageMods.buffs, [buff.id]: e.target.checked },
                },
              })
            }
          />
          <span>{buff.label}</span>
        </BuffOption>
      ))}
    </Panel>
  );
}
