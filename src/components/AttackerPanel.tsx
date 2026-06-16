import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { StepControl } from '@/components/StepControl';
import { BuffOption } from '@/components/targetPanelPrimitives';
import { Panel, PanelTitle, Row, Select } from '@/components/ui';

export function AttackerPanel() {
  const {
    attacker,
    availableAttackers,
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
      <PanelTitle>Attacker</PanelTitle>
      <Row>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted)',
            }}
          >
            Model
          </span>
          <Select
            value={attacker.id}
            onChange={(e) =>
              dispatch({ type: 'selectAttacker', id: e.target.value })
            }
            aria-label="Select attacker model"
          >
            {availableAttackers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </label>
        <StepControl
          label="Influence"
          value={influence}
          min={0}
          max={attacker.inf}
          onChange={(v) => dispatch({ type: 'influence', value: v })}
          valueLabel={String(influence)}
          decrementAriaLabel="Decrease influence"
          incrementAriaLabel="Increase influence"
        />
        <StepControl
          label="Starting momentum"
          value={startingMomentum}
          min={attacker.startingMomentum.min}
          max={attacker.startingMomentum.max}
          onChange={(v) => dispatch({ type: 'startingMomentum', value: v })}
          valueLabel={String(startingMomentum)}
          decrementAriaLabel="Decrease starting momentum"
          incrementAriaLabel="Increase starting momentum"
        />
        <StepControl
          label="Initial TAC modifier"
          value={initialTacModifier}
          min={attacker.initialTacModifier.min}
          max={attacker.initialTacModifier.max}
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
          attacker.furious
            ? 'Charge this activation (free for Furious).'
            : 'Charge this activation (costs 2 influence).'
        }
      >
        <input
          type="checkbox"
          checked={charging}
          onChange={(e) => dispatch({ type: 'charging', value: e.target.checked })}
        />
        <span>Charging{attacker.furious ? ' (free)' : ' (-2 influence)'}</span>
      </BuffOption>
      {attacker.guild.buffs.map((buff) => (
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
