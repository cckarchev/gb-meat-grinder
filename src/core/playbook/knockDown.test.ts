import { describe, expect, it } from 'vitest';
import {
  knockDownIsOnlyEffect,
  knockDownTakenBeforePick,
} from '@/core/playbook/knockDown';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';
import { thresher } from '@/data/attackers/thresher';

describe('knockDownTakenBeforePick', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['kd']];

  it('allows only the first KD in the activation', () => {
    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2),
    ).toBe(false);

    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(true);

    expect(
      knockDownTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2, true),
    ).toBe(true);
  });
});

describe('knockDownIsOnlyEffect', () => {
  const fixtureKnockDown = getPlaybookResult(makeAttacker(), 'kd');

  it('is true for a line whose only effect is the Knock Down', () => {
    const bareKnockDown = { ...fixtureKnockDown, dodge: false };

    expect(knockDownIsOnlyEffect(bareKnockDown)).toBe(true);
  });

  it('is false when the line also dodges', () => {
    expect(knockDownIsOnlyEffect(fixtureKnockDown)).toBe(false);
  });

  it('is false when the line also deals damage', () => {
    expect(knockDownIsOnlyEffect(getPlaybookResult(thresher, 'm3_kd'))).toBe(
      false,
    );
  });

  it('is false for a line without Knock Down', () => {
    expect(knockDownIsOnlyEffect(getPlaybookResult(thresher, 'm2'))).toBe(
      false,
    );
  });
});
