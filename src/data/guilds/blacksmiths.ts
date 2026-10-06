import { searingStrike as searingStrikeTrait } from '@/data/characterTraits';
import { singledOut, stagger, tooledUp, weakPoint } from '@/data/guildBuffs';
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
    singledOut,
    {
      id: 'eyeSpy',
      label: 'Eye Spy',
      tooltip: '+2 TAC while attacking the target enemy model.',
      tacBonus: 2,
    },
    {
      id: 'searingStrike',
      label: 'Searing Strike',
      tooltip:
        'The target already suffers -1 ARM from Searing Strike this turn.',
      target: 'enemy',
      armorReduction: 1,
    },
    weakPoint,
    {
      id: 'instruction',
      label: 'Instruction',
      tooltip:
        "Hearth's play on an Apprentice: its next attack gains +2 net hits, added after ARM even when the roll nets none.",
      firstAttackNetHitBonus: 2,
    },
    {
      id: 'oneAtATimeLads',
      label: 'One at a Time Lads!',
      tooltip:
        "Within 2″ of Furnace's target friendly model: ignore the crowding out penalty.",
      ignoresCrowdingOut: true,
    },
    stagger,
    {
      id: 'shieldGlare',
      label: 'Shield Glare',
      tooltip: 'The enemy model suffers -1 DEF.',
      target: 'enemy',
      defReduction: 1,
    },
  ],
};
