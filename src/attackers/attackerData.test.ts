/**
 * Integrity checks for the hand-written model and guild data. The engine
 * trusts these invariants, so a typo in a new attacker file should fail here
 * rather than surface as a wrong number in the UI.
 */

import { describe, expect, it } from 'vitest';
import { ATTACKERS } from '@/attackers/registry';
import type { Guild } from '@/types/core/guild';

const guildModules = import.meta.glob<Record<string, Guild>>('@/guilds/*.ts', {
  eager: true,
});
const GUILDS = Object.values(guildModules).flatMap((module) =>
  Object.values(module),
);

const duplicatesOf = (values: readonly string[]): string[] => {
  return values.filter((value, index) => values.indexOf(value) !== index);
};

describe('attacker registry', () => {
  it('has unique model ids', () => {
    expect(duplicatesOf(ATTACKERS.map((a) => a.id))).toEqual([]);
  });
});

describe.each(ATTACKERS)('$name data', (attacker) => {
  const results = attacker.playbook.flatMap((column) => column.results);

  it('has sane base stats and ranges', () => {
    expect(attacker.tac).toBeGreaterThan(0);
    expect(attacker.inf).toBeGreaterThanOrEqual(0);

    for (const range of [
      attacker.startingMomentum,
      attacker.gangingUp,
      attacker.crowdingOut,
    ]) {
      expect(range.min).toBeLessThanOrEqual(range.max);
    }
  });

  it('has playbook columns in strictly ascending order from net 1', () => {
    const nets = attacker.playbook.map((column) => column.netSuccesses);
    const sorted = [...nets].sort((a, b) => a - b);

    expect(nets[0]).toBeGreaterThanOrEqual(1);
    expect(nets).toEqual(sorted);
    expect(new Set(nets).size).toBe(nets.length);
  });

  it('has unique result ids with non-negative damage and a label', () => {
    expect(duplicatesOf(results.map((r) => r.id))).toEqual([]);

    for (const result of results) {
      expect(result.damage).toBeGreaterThanOrEqual(0);
      expect(result.label.length).toBeGreaterThan(0);
    }
  });

  it('lists character plays when any result picks one', () => {
    const picksPlay = results.some((r) => r.picksCharacterPlay);

    if (!picksPlay) {
      return;
    }

    expect(attacker.characterPlays?.length ?? 0).toBeGreaterThan(0);
  });

  it('only excludes buffs its guild actually grants', () => {
    const guildBuffIds = attacker.guild.buffs.map((b) => b.id);

    for (const excluded of attacker.excludedGuildBuffs ?? []) {
      expect(guildBuffIds).toContain(excluded);
    }
  });

  it('has uniquely named special abilities that deal damage', () => {
    const abilities = attacker.specialAbilities ?? [];

    expect(duplicatesOf(abilities.map((a) => a.id))).toEqual([]);

    for (const ability of abilities) {
      expect(ability.flatDamage).toBeGreaterThan(0);
    }
  });
});

describe('guild data', () => {
  it('loads every guild module', () => {
    expect(GUILDS.length).toBe(Object.keys(guildModules).length);
  });

  it('has unique guild ids and hex colors', () => {
    expect(duplicatesOf(GUILDS.map((g) => g.id))).toEqual([]);

    for (const guild of GUILDS) {
      expect(guild.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each(GUILDS)('$name has unique buff ids', (guild) => {
    expect(duplicatesOf(guild.buffs.map((b) => b.id))).toEqual([]);
  });
});
