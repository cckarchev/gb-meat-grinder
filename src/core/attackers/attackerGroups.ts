import type { AttackerData } from '@/data/attackers/attacker.types';

export type AttackerGroup = {
  name: string;
  models: AttackerData[];
};

const byName = (a: { name: string }, b: { name: string }): number => {
  return a.name.localeCompare(b.name);
};

/** Models grouped by guild for the model picker, guilds and models by name. */
export const groupAttackersByGuild = (
  attackers: readonly AttackerData[],
): AttackerGroup[] => {
  const byGuild = new Map<string, AttackerGroup>();

  for (const attacker of attackers) {
    const group = byGuild.get(attacker.guild.id) ?? {
      name: attacker.guild.name,
      models: [],
    };

    group.models.push(attacker);
    byGuild.set(attacker.guild.id, group);
  }

  const groups = [...byGuild.values()].map((group) => ({
    name: group.name,
    models: [...group.models].sort(byName),
  }));

  return groups.sort(byName);
};
