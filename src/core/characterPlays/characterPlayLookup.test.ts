import { describe, expect, it } from 'vitest';
import {
  defaultCharacterPlayId,
  getCharacterPlay,
  initialCharacterPlayFor,
  playSlotForPick,
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

describe('playSlotForPick', () => {
  const attacker = makeAttacker();

  it('keeps the chosen play while the pick still uses one', () => {
    expect(playSlotForPick(attacker, 'gb', 'playDef')).toBe('playDef');
  });

  it('fills an empty slot with the default play', () => {
    expect(playSlotForPick(attacker, 'gb', null)).toBe('playTac');
  });

  it('clears the slot when the pick is empty or uses no play', () => {
    expect(playSlotForPick(attacker, null, 'playDef')).toBeNull();
    expect(playSlotForPick(attacker, 'one', 'playDef')).toBeNull();
  });
});
