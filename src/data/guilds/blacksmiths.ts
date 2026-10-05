import { searingStrike as searingStrikeTrait } from '@/data/characterTraits';
import { tooledUp, weakPoint } from '@/data/guildBuffs';
import type { Guild } from '@/data/guilds/guild.types';

export const blacksmiths: Guild = {
  id: 'blacksmiths',
  name: 'Blacksmiths',
  color: '#82969f',
  buffs: [
    {
      id: 'temperedSteel',
      label: 'Tempered Steel',
      tooltip:
        "Furnace's legendary aura, as Captain: +1 TAC and Searing Strike.",
      tacBonus: 1,
      grantsTraits: [searingStrikeTrait],
    },
    tooledUp,
    {
      id: 'searingStrike',
      label: 'Searing Strike',
      tooltip:
        'The target already suffers -1 ARM from Searing Strike this turn.',
      target: 'enemy',
      armorReduction: 1,
    },
    weakPoint,
  ],
};
