import { lovedCreature, singledOut } from '@/data/guildBuffs';
import type { Guild } from '@/data/guilds/guild.types';

export const lumberjacks: Guild = {
  id: 'lumberjacks',
  name: 'Lumberjacks',
  color: '#416abb',
  buffs: [
    singledOut,
    lovedCreature,
    {
      id: 'cutEmDown',
      label: "Cut 'Em Down",
      tooltip: "Within Oak's melee zone, the enemy model suffers -1 DEF.",
      target: 'enemy',
      defReduction: 1,
    },
  ],
};
