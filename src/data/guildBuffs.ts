import type { GuildBuff } from '@/data/guilds/guild.types';

/**
 * Guild buffs several guilds share. Like character plays, they are defined once
 * and referenced by each guild, which also keeps their ids (their names for the
 * stacking rule) identical everywhere.
 */

export const tooledUp: GuildBuff = {
  id: 'tooledUp',
  label: 'Tooled Up',
  tooltip:
    '+1 DMG to character plays that cause damage and to playbook damage results.',
  damageBonus: 1,
};

export const weakPoint: GuildBuff = {
  id: 'weakPoint',
  label: 'Weak Point',
  tooltip: 'The enemy model suffers -1 ARM.',
  target: 'enemy',
  armorReduction: 1,
};
