import { useMemo } from 'react';
import styled from 'styled-components';
import { Select } from '@/components/ui';
import { groupAttackersByGuild } from '@/core/attackerGroups';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const ModelField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  grid-column: 1 / -1;
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

/** Model picker, grouped by guild. */
export const AttackerModelSelect = () => {
  const { attacker, availableAttackers, dispatch } = useMeatGrinderSimulation();

  const guildGroups = useMemo(
    () => groupAttackersByGuild(availableAttackers),
    [availableAttackers],
  );

  return (
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
            {group.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </ModelSelect>
    </ModelField>
  );
};
