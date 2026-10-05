import { describe, expect, it } from 'vitest';
import {
  defaultCharacterPlayId,
  effectivePlayForPick,
  getCharacterPlay,
  initialCharacterPlayFor,
  playSlotForPick,
} from '@/core/characterPlays/characterPlayLookup';
import { makeAttacker, PLAY_DEF } from '@/core/testing/fixtures';

describe('character play lookup', () => {
  it('resolves character plays by id', () => {
    const attacker = makeAttacker();

    expect(getCharacterPlay(attacker, 'playDef')).toBe(PLAY_DEF);
    expect(getCharacterPlay(attacker, null)).toBeUndefined();
  });

  it('defaults to the first character play, or null without any', () => {
    expect(defaultCharacterPlayId(makeAttacker())).toBe('playTac');

    expect(defaultCharacterPlayId(makeAttacker({ characterPlays: [] }))).toBe(
      null,
    );
  });

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

describe('effectivePlayForPick', () => {
  const attacker = makeAttacker();

  it('reads the play held in the slot', () => {
    expect(effectivePlayForPick(attacker, [[null, 'playDef']], 0, 1)).toBe(
      'playDef',
    );
  });

  it('falls back to the default play for an empty or missing slot', () => {
    expect(effectivePlayForPick(attacker, [[null]], 0, 0)).toBe('playTac');
    expect(effectivePlayForPick(attacker, [], 3, 0)).toBe('playTac');
  });
});
