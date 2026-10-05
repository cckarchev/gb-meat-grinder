import { useMemo } from 'react';
import styled from 'styled-components';
import { Select } from '@/components/ui/ui';
import { groupAttackersByGuild } from '@/data/attackers/attackerGroups';
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
  letter-spacing: var(--tracking-caps);
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
        onChange={(event) =>
          dispatch({ type: 'selectAttacker', id: event.target.value })
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
