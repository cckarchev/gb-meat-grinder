import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { attackArraySize } from '@/core/attacks/attackStructure';
import {
  knockDownIsOnlyEffect,
  knockDownTakenBeforePick,
} from '@/core/playbook/knockDown';
import type { WrapPick } from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  planOf,
} from '@/core/testing/fixtures';
import { crossCut } from '@/data/attackers/crossCut';
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

  it('is true for a momentous KD with nothing else', () => {
    const momentousKnockDown = getPlaybookResult(crossCut, 'kd');

    expect(knockDownIsOnlyEffect(momentousKnockDown)).toBe(true);
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

describe('Knock Down on a target that starts Knocked Down', () => {
  const attacker = makeAttacker();

  // `kd` also dodges, so the clamp keeps it; only its KD must be dropped.
  const knockDownThenOne = () => {
    const picks: WrapPick[][] = [['kd'], ['one']];

    while (picks.length < attackArraySize(attacker)) {
      picks.push([]);
    }

    return picks;
  };

  const derive = (enemyKnockedDown: boolean) => {
    const picks = knockDownThenOne();

    return deriveSimulation(attacker, {
      enemyDef: 4,
      armor: 0,
      hp: NEUTRAL_TARGET_HP,
      influence: attacker.inf,
      charging: false,
      chargeAttackIndex: NO_ATTACK_INDEX,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      enemyKnockedDown,
      enemySnared: false,
      enemyResilience: false,
      gangingUp: 0,
      crowdingOut: 0,
      bonusTimeByAttack: picks.map(() => false),
      damageMods: NO_MODS,
      activeTraits: {},
      attackPlan: planOf(picks),
    });
  };

  it('carries the KD into later swings when the target is standing', () => {
    expect(derive(false).timeline[1].effectsBefore.defReduction).toBe(1);
  });

  it('does not lower DEF again for later swings', () => {
    const derived = derive(true);

    expect(derived.timeline[1].effectsBefore.defReduction).toBe(0);
    expect(derived.attacks[1].defMinRoll).toBe(derived.attacks[0].defMinRoll);
  });
});
