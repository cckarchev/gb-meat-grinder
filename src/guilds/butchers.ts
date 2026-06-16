import type { Guild } from '@/types/core/guild';

export const butchers: Guild = {
  id: 'butchers',
  name: 'Butchers',
  color: '#ce1f27',
  buffs: [
    {
      id: 'tooledUp',
      label: 'Tooled Up',
      tooltip: '+1 damage on each selected playbook line damage result.',
      damageBonus: 1,
    },
    {
      id: 'theOwner',
      label: 'The Owner',
      tooltip: '+1 damage on each selected playbook line damage result.',
      damageBonus: 1,
    },
  ],
};
