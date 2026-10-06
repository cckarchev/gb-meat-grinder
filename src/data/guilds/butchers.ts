import { lovedCreature, theyAintTough, tooledUp } from '@/data/guildBuffs';
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
    {
      id: 'butchery',
      label: 'Butchery',
      tooltip: '+1 DMG to playbook damage results while attacking the target.',
      playbookDamageBonus: 1,
    },
    {
      id: 'getEmLads',
      label: "Get 'Em Lads!",
      tooltip:
        "Ox's legendary aura: +1 DMG to character plays that cause damage and to playbook damage results, and the enemy model suffers -1 ARM.",
      damageBonus: 1,
      armorReduction: 1,
    },
    lovedCreature,
    theyAintTough,
    {
      id: 'dirtyKnives',
      label: 'Dirty Knives',
      tooltip: 'The enemy model suffers -1 DEF.',
      target: 'enemy',
      defReduction: 1,
    },
    {
      id: 'thousandCuts',
      label: 'Thousand Cuts',
      tooltip: 'The enemy model suffers -2 DEF.',
      target: 'enemy',
      defReduction: 2,
    },
  ],
};
