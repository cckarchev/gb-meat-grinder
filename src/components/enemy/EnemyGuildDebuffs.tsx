import { LABEL_GUILD_DEBUFFS } from '@/components/enemy/enemyPanelCopy';
import { GuildBuffCheckbox } from '@/components/ui/GuildBuffCheckbox';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { guildBuffsFor } from '@/core/damage/damage';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const DEBUFF_COLUMNS = 2;

/**
 * The attacker's guild debuffs already on the target (e.g. They Ain't Tough!),
 * titled in the guild color because they come from the attacker's guild.
 */
export const EnemyGuildDebuffs = () => {
  const { attacker } = useMeatGrinderSimulation();

  const debuffs = guildBuffsFor(attacker, 'enemy');

  if (debuffs.length === 0) {
    return null;
  }

  return (
    <ToggleGroup
      title={LABEL_GUILD_DEBUFFS}
      color={attacker.guild.color}
      columns={DEBUFF_COLUMNS}
    >
      {debuffs.map((debuff) => (
        <GuildBuffCheckbox key={debuff.id} buff={debuff} />
      ))}
    </ToggleGroup>
  );
};
