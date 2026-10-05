import { describe, expect, it } from 'vitest';
import {
  defaultCharacterPlayId,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import { wrapPickClearsCover } from '@/core/playbook/coverClearing';
import {
  defaultWrapPicks,
  getPlaybookResult,
  netSuccessesForChoice,
  rowHasWrapContinuation,
  rowHasWrapPick,
  wrapExtendedNetNeeded,
  wrapNetThresholdAllHits,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/playbook/wrapSlots';
import { makeAttacker, PLAY_DEF } from '@/core/testing/fixtures';

describe('lookups', () => {
  const attacker = makeAttacker();

  it('resolves results, columns and character plays by id', () => {
    expect(getPlaybookResult(attacker, 'two').damage).toBe(2);
    expect(netSuccessesForChoice(attacker, 'kd')).toBe(3);
    expect(getCharacterPlay(attacker, 'playDef')).toBe(PLAY_DEF);
    expect(getCharacterPlay(attacker, null)).toBeUndefined();
  });

  it('throws on unknown playbook ids', () => {
    expect(() => getPlaybookResult(attacker, 'nope')).toThrow();
    expect(() => netSuccessesForChoice(attacker, 'nope')).toThrow();
  });

  it('defaults to the first character play, or null without any', () => {
    expect(defaultCharacterPlayId(attacker)).toBe('playTac');

    expect(defaultCharacterPlayId(makeAttacker({ characterPlays: [] }))).toBe(
      null,
    );
  });

  it('builds one empty slot per row by default', () => {
    expect(defaultWrapPicks(2)).toEqual([[null], [null]]);
  });
});

describe('wrap slots', () => {
  const attacker = makeAttacker();

  it('needs one slot per card width of net successes', () => {
    expect(wrapSlotCount(attacker, 0)).toBe(1);
    expect(wrapSlotCount(attacker, 4)).toBe(1);
    expect(wrapSlotCount(attacker, 5)).toBe(2);
    expect(wrapSlotCount(attacker, 9)).toBe(3);
  });

  it('budgets each slot from what is left after full steps', () => {
    expect(wrapSlotBudget(attacker, 9, 0)).toBe(4);
    expect(wrapSlotBudget(attacker, 9, 1)).toBe(4);
    expect(wrapSlotBudget(attacker, 9, 2)).toBe(1);
    expect(wrapSlotBudget(attacker, 4, 1)).toBe(0);
  });

  it('extends net needed past the card width on later slots', () => {
    expect(wrapExtendedNetNeeded(attacker, 1, 2)).toBe(6);
    expect(wrapNetThresholdAllHits(attacker, ['four', 'one'])).toBe(5);
    expect(wrapNetThresholdAllHits(attacker, ['two', null])).toBe(2);
    expect(wrapNetThresholdAllHits(attacker, [])).toBe(0);
  });

  it('knows which picks clear cover', () => {
    expect(wrapPickClearsCover(attacker, 'push')).toBe(true);
    expect(wrapPickClearsCover(attacker, 'two')).toBe(false);
    expect(wrapPickClearsCover(attacker, null)).toBe(false);
  });
});

describe('rowHasWrapPick', () => {
  it('is true when any slot of the row holds a pick', () => {
    expect(rowHasWrapPick([null, 'two'])).toBe(true);
  });

  it('is false when every slot is empty', () => {
    expect(rowHasWrapPick([null, null])).toBe(false);
  });

  it('is false for a missing row', () => {
    expect(rowHasWrapPick(undefined)).toBe(false);
  });
});

describe('rowHasWrapContinuation', () => {
  it('is true when the row has slots past the primary pick', () => {
    expect(rowHasWrapContinuation(['two', null])).toBe(true);
  });

  it('is false when the row only has the primary pick', () => {
    expect(rowHasWrapContinuation(['two'])).toBe(false);
  });
});
