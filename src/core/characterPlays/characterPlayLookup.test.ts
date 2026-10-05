import { describe, expect, it } from 'vitest';
import {
  defaultCharacterPlayId,
  getCharacterPlay,
  initialCharacterPlayFor,
} from '@/core/characterPlays/characterPlayLookup';
import { makeAttacker } from '@/core/testing/fixtures';

describe('character play lookup', () => {
  it('treats a model without plays as having none', () => {
    const playless = makeAttacker({ characterPlays: undefined });

    expect(getCharacterPlay(playless, 'playTac')).toBeUndefined();
    expect(defaultCharacterPlayId(playless)).toBeNull();
  });
});

describe('initialCharacterPlayFor', () => {
  it('starts a character-play pick on the default play', () => {
    const attacker = makeAttacker();

    expect(initialCharacterPlayFor(attacker, 'gb')).toBe(
      defaultCharacterPlayId(attacker),
    );
  });

  it('leaves the slot empty for a pick without a character play', () => {
    expect(initialCharacterPlayFor(makeAttacker(), 'one')).toBeNull();
  });
});
