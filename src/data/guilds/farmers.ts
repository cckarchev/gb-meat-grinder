import { theyAintTough, weakPoint } from '@/data/guildBuffs';
import type { Guild } from '@/data/guilds/guild.types';

export const farmers: Guild = {
  id: 'farmers',
  name: 'Farmers',
  color: '#ea8329',
  buffs: [
    theyAintTough,
    weakPoint,
    {
      id: 'ourToolsAreSharp',
      label: 'Our Tools Are Sharp',
      tooltip:
        "Playbook damage becomes Condition Damage, ignoring the enemy's Tough Hide.",
      ignoresToughHide: true,
    },
    {
      id: 'lendAHand',
      label: 'Lend a Hand',
      tooltip: 'Ganging up with Festival: +1 TAC. Ganging up is at least +1.',
      tacBonus: 1,
      gangingUpMin: 1,
    },
    {
      id: 'maximumEffort',
      label: 'Maximum Effort',
      tooltip: 'Non-momentous playbook damage results are momentous.',
      damageResultsMomentous: true,
    },
  ],
};
