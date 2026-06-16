import { useMemo } from 'react';
import styled from 'styled-components';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { StepControl } from '@/components/StepControl';
import { BuffOption } from '@/components/targetPanelPrimitives';
import { Panel, PanelTitle, Select } from '@/components/ui';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import type { AttackerData } from '@/types/core/attacker';

/**
 * Two equal columns so the controls line up in a grid (e.g. Influence sits
 * directly above Initial TAC modifier) instead of flex-wrapping unaligned.
 */
const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;

  ${narrowViewport} {
    gap: 0.55rem;
  }

  ${extraNarrowViewport} {
    grid-template-columns: 1fr;
  }
`;

const ModelField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ModelFieldLabel = styled.span`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
`;

const ModelSelect = styled(Select)`
  width: 100%;
`;

export function AttackerPanel() {
  const {
    attacker,
    availableAttackers,
    damageMods,
    specialAbilities,
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

  const guildGroups = useMemo(() => {
    const byGuild = new Map<string, { name: string; models: AttackerData[] }>();
    for (const a of availableAttackers) {
      const group = byGuild.get(a.guild.id) ?? {
        name: a.guild.name,
        models: [],
      };
      group.models.push(a);
      byGuild.set(a.guild.id, group);
    }
    return [...byGuild.values()]
      .map((g) => ({
        name: g.name,
        models: [...g.models].sort((x, y) => x.name.localeCompare(y.name)),
      }))
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [availableAttackers]);

  return (
    <Panel>
      <PanelTitle>Attacker</PanelTitle>
      <ControlsGrid>
        <ModelField>
          <ModelFieldLabel>Model</ModelFieldLabel>
          <ModelSelect
            value={attacker.id}
            onChange={(e) =>
              dispatch({ type: 'selectAttacker', id: e.target.value })
            }
            aria-label="Select attacker model"
          >
            {guildGroups.map((group) => (
              <optgroup key={group.name} label={group.name}>
                {group.models.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </ModelSelect>
        </ModelField>
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
      </ControlsGrid>
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
          onChange={(e) =>
            dispatch({ type: 'charging', value: e.target.checked })
          }
        />
        <span>Charging{attacker.furious ? ' (free)' : ' (-2 influence)'}</span>
      </BuffOption>
      {attacker.guild.buffs.map((buff) => {
        const disabled =
          attacker.excludedGuildBuffs?.includes(buff.id) ?? false;
        return (
          <BuffOption
            key={buff.id}
            $disabled={disabled}
            title={
              disabled
                ? `${buff.tooltip} (not available to ${attacker.name})`
                : buff.tooltip
            }
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={!disabled && damageMods.buffs[buff.id] === true}
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
        );
      })}
      {(attacker.specialAbilities ?? []).map((ability) => (
        <BuffOption key={ability.id} title={ability.tooltip}>
          <input
            type="checkbox"
            checked={specialAbilities[ability.id] === true}
            onChange={(e) =>
              dispatch({
                type: 'specialAbility',
                id: ability.id,
                value: e.target.checked,
              })
            }
          />
          <span>
            {ability.label} (+{ability.flatDamage})
          </span>
        </BuffOption>
      ))}
    </Panel>
  );
}
