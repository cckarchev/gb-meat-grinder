import type { Guild } from '@/data/guilds/guild.types';

export const farmers: Guild = {
  id: 'farmers',
  name: 'Farmers',
  color: '#ea8329',
  buffs: [
    {
      id: 'theyAintTough',
      label: "They Ain't Tough!",
      tooltip: 'The enemy model suffers -1 ARM.',
      armorReduction: 1,
    },
    {
      id: 'weakPoint',
      label: 'Weak Point',
      tooltip:
        "The enemy model suffers -1 ARM (stacks with They Ain't Tough!).",
      armorReduction: 1,
    },
    {
      id: 'ourToolsAreSharp',
      label: 'Our Tools Are Sharp',
      tooltip:
        "Playbook damage becomes Condition Damage, ignoring the enemy's Tough Hide.",
      ignoresToughHide: true,
    },
  ],
};
