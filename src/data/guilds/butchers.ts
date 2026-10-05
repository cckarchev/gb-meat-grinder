import { tooledUp } from '@/data/guildBuffs';
import type { Guild } from '@/data/guilds/guild.types';

export const butchers: Guild = {
  id: 'butchers',
  name: 'Butchers',
  color: '#ce1f27',
  buffs: [
    tooledUp,
    {
      id: 'theOwner',
      label: 'The Owner',
      tooltip:
        '+1 DMG to character plays that cause damage and to playbook damage results.',
      damageBonus: 1,
    },
  ],
};
