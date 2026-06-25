import { tooledUp } from '@/guildBuffs';
import type { Guild } from '@/types/core/guild';

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
        '+1 damage on each selected playbook line damage result and character plays.',
      damageBonus: 1,
    },
  ],
};
