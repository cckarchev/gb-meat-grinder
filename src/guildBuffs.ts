import type { GuildBuff } from '@/types/core/guild';

/**
 * Shared guild buffs reused across guilds. Like {@link characterPlays}, these are
 * not unique to one guild: several guilds grant the same teammate buff, so they
 * share a single definition rather than re-declaring it per guild.
 */

/**
 * Tooled Up: a teammate grants +1 DMG on each selected playbook line damage
 * result for the activation. The same buff appears across guilds (e.g. Butchers,
 * Blacksmiths), so they all reference this one definition.
 */
export const tooledUp: GuildBuff = {
  id: 'tooledUp',
  label: 'Tooled Up',
  tooltip:
    '+1 damage on each selected playbook line damage result and character plays.',
  damageBonus: 1,
};
