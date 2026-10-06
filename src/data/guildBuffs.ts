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

export const singledOut: GuildBuff = {
  id: 'singledOut',
  label: 'Singled Out',
  tooltip: '+2 TAC while attacking the target enemy model.',
  tacBonus: 2,
};

export const stagger: GuildBuff = {
  id: 'stagger',
  label: 'Stagger',
  tooltip: 'The enemy model suffers -1 DEF.',
  target: 'enemy',
  defReduction: 1,
};

export const theyAintTough: GuildBuff = {
  id: 'theyAintTough',
  label: "They Ain't Tough!",
  tooltip: 'The enemy model suffers -1 ARM.',
  target: 'enemy',
  armorReduction: 1,
};

export const lovedCreature: GuildBuff = {
  id: 'lovedCreature',
  label: 'Loved Creature',
  tooltip:
    'A friendly Loved Creature mascot suffered damage from an enemy this turn: +1 TAC.',
  tacBonus: 1,
};
