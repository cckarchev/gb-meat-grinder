import { useMemo } from 'react';
import styles from '@/components/attacker/AttackerModelSelect.module.css';
import { Select } from '@/components/ui/ui';
import { groupAttackersByGuild } from '@/core/attackers/attackerGroups';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Model picker, grouped by guild. */
export const AttackerModelSelect = () => {
  const { attacker, availableAttackers, dispatch } = useMeatGrinderSimulation();

  const guildGroups = useMemo(
    () => groupAttackersByGuild(availableAttackers),
    [availableAttackers],
  );

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: `Select` renders a native <select>, which this label wraps.
    <label className={styles.field}>
      <span className={styles.fieldLabel}>Model</span>
      <Select
        className={styles.select}
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
      </Select>
    </label>
  );
};
