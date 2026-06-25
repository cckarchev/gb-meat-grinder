import { tooledUp } from '@/guildBuffs';
import type { Guild } from '@/types/core/guild';

export const blacksmiths: Guild = {
  id: 'blacksmiths',
  name: 'Blacksmiths',
  color: '#82969f',
  buffs: [
    {
      id: 'temperedSteel',
      label: 'Tempered Steel',
      tooltip:
        "Furnace's legendary aura: +1 TAC and Searing Strike — the target suffers -1 ARM and Burning after this model's first damaging hit.",
      tacBonus: 1,
      grantsSearingStrike: true,
    },
    tooledUp,
    {
      id: 'searingStrike',
      label: 'Searing Strike',
      tooltip: 'The target suffers -1 ARM for the whole activation.',
      target: 'enemy',
      appliesSearingStrike: true,
    },
    {
      id: 'weakPoint',
      label: 'Weak Point',
      tooltip: 'The target suffers -1 ARM.',
      target: 'enemy',
      armorReduction: 1,
    },
    {
      id: 'burning',
      label: 'Burning',
      tooltip: 'The target starts the activation Burning.',
      target: 'enemy',
      appliesBurning: true,
    },
  ],
};
