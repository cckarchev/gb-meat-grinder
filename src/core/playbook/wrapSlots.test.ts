import { describe, expect, it } from 'vitest';
import { probAttackSucceeds } from '@/core/damage/probability';
import {
  defaultWrapPicks,
  rowHasWrapContinuation,
  rowHasWrapPick,
  wrapExtendedNetNeeded,
  wrapNetThresholdAllHits,
  wrapSlotBudget,
  wrapSlotColumns,
  wrapSlotCount,
} from '@/core/playbook/wrapSlots';
import { makeAttacker } from '@/core/testing/fixtures';

describe('default plan rows', () => {
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

describe('wrapSlotColumns', () => {
  const attacker = makeAttacker();
  const roll = { tac: 6, pHit: 0.5, armor: 1, netHitBonus: 0 };

  it('keeps only the columns within the slot budget', () => {
    const nets = (maxNet: number, pickIndex: number) => {
      return wrapSlotColumns(attacker, roll, maxNet, pickIndex).map(
        ({ column }) => column.netSuccesses,
      );
    };

    expect(nets(2, 0)).toEqual([1, 2]);
    expect(nets(9, 2)).toEqual([1]);
  });

  it('makes the columns the gained net hits cover certain', () => {
    const instructed = { ...roll, netHitBonus: 2 };
    const chances = wrapSlotColumns(attacker, instructed, 4, 0).map(
      ({ hitChance }) => hitChance,
    );

    expect(chances.slice(0, 2)).toEqual([1, 1]);
    expect(chances[2]).toBeLessThan(1);
  });

  it('prices each column at the net the slot actually needs', () => {
    const [first] = wrapSlotColumns(attacker, roll, 9, 1);
    const netNeeded = wrapExtendedNetNeeded(attacker, 1, 1);

    expect(first.hitChance).toBe(
      probAttackSucceeds(roll.tac, roll.pHit, roll.armor, netNeeded),
    );
  });
});
