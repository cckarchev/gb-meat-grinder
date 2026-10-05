import { describe, expect, it } from 'vitest';
import { groupAttackersByGuild } from '@/core/attackers/attackerGroups';
import { makeAttacker, TEST_GUILD } from '@/core/testing/fixtures';

const OTHER_GUILD = { ...TEST_GUILD, id: 'alpha', name: 'Alpha' };

describe('groupAttackersByGuild', () => {
  it('groups models by guild, sorting guilds and models by name', () => {
    const zed = makeAttacker({ id: 'zed', name: 'Zed' });
    const amy = makeAttacker({ id: 'amy', name: 'Amy' });
    const bob = makeAttacker({ id: 'bob', name: 'Bob', guild: OTHER_GUILD });

    expect(groupAttackersByGuild([zed, bob, amy])).toEqual([
      { name: 'Alpha', models: [bob] },
      { name: 'Testers', models: [amy, zed] },
    ]);
  });

  it('returns no groups without models', () => {
    expect(groupAttackersByGuild([])).toEqual([]);
  });
});
