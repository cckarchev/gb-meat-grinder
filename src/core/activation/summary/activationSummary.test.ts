import { describe, expect, it } from 'vitest';
import {
  activeSwings,
  summarizeActivation,
  swingIsSkipped,
} from '@/core/activation/summary/activationSummary';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { activeTraitFlatDamage } from '@/core/damage/damage';
import { rowDamageIfAllHit } from '@/core/playbook/rowDamage';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
} from '@/core/testing/fixtures';
import { sweepingCharge } from '@/data/characterTraits';

/** A swing that always rolls exactly `tac` net successes. */
const certainSwing = (attackIndex: number, tac: number): AttackRollContext => {
  return {
    attackIndex,
    tac,
    armor: 0,
    defMinRoll: 2,
    pHit: 1,
    netSuccessesNeeded: tac,
    prob: 1,
  };
};

const flaky = (attackIndex: number, prob: number): AttackRollContext => {
  return { ...certainSwing(attackIndex, 2), prob };
};

const input = (
  overrides: Partial<ActivationSummaryInput> = {},
): ActivationSummaryInput => {
  const scenario = {
    attacker: makeAttacker(),
    attacks: [certainSwing(0, 2), certainSwing(1, 2)],
    ignoredDisplayIndex: -1,
    killingBlowIndex: -1,
    wrapPicks: [['two'], ['two']],
    bonusTimeByAttack: [false, false],
    damageMods: NO_MODS,
    activeTraits: {},
    startingMomentum: 0,
    activeBaseCount: 2,
    targetHp: 10,
    ...overrides,
  };

  // Derived the way `deriveSimulation` does, unless a test pins them.
  const characterPlayPicks = scenario.wrapPicks.map((row) => {
    return row.map(() => null);
  });

  const timeline = activationTimeline(
    { wrapPicks: scenario.wrapPicks, characterPlayPicks },
    {
      attacker: scenario.attacker,
      damageMods: scenario.damageMods,
      activeBaseCount: scenario.activeBaseCount,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp: scenario.targetHp,
    },
  );

  const rowDamageIfHit = rowDamageIfAllHit(
    scenario.attacker,
    scenario.wrapPicks,
    scenario.damageMods,
    scenario.activeBaseCount,
    timeline,
  );

  const flatDamage = activeTraitFlatDamage(
    scenario.attacker,
    scenario.activeTraits,
  );

  return { timeline, rowDamageIfHit, flatDamage, ...scenario };
};

describe('activeSwings', () => {
  const attacks = [certainSwing(0, 2), certainSwing(1, 2), certainSwing(2, 2)];

  it('keeps every swing by default', () => {
    expect(activeSwings(attacks, -1, -1)).toEqual(attacks);
  });

  it('drops the ignored lead swing and everything after the killing blow', () => {
    expect(activeSwings(attacks, 0, 1)).toEqual([attacks[1]]);
  });
});

describe('swingIsSkipped', () => {
  it('plays every swing when nothing is ignored and nothing kills', () => {
    expect(swingIsSkipped(0, -1, -1)).toBe(false);
    expect(swingIsSkipped(2, -1, -1)).toBe(false);
  });

  it('skips the swing Resilience ignores', () => {
    expect(swingIsSkipped(0, 0, -1)).toBe(true);
    expect(swingIsSkipped(1, 0, -1)).toBe(false);
  });

  it('plays the killing blow and skips every swing after it', () => {
    expect(swingIsSkipped(1, -1, 1)).toBe(false);
    expect(swingIsSkipped(2, -1, 1)).toBe(true);
  });
});

describe('summarizeActivation', () => {
  it('totals damage and momentum when every pick hits', () => {
    const summary = summarizeActivation(input());

    expect(summary.totalDamageIfAllHit).toBe(4);
    expect(summary.netMomentumIfAllHit).toBe(2);
    expect(summary.netMomentumTooltip).toBe('+2 from momentous results.');
    expect(summary.damageDealtTooltip).toBe('4 from card pips = 4.');
  });

  it('counts the killing blow and stops at it', () => {
    const summary = summarizeActivation(
      input({ targetHp: 2, killingBlowIndex: 0 }),
    );

    expect(summary.activeAttacks).toHaveLength(1);
    expect(summary.totalDamageIfAllHit).toBe(2);
    expect(summary.netMomentumIfAllHit).toBe(2);

    expect(summary.netMomentumTooltip).toBe(
      '+1 from momentous results; +1 killing blow.',
    );
  });

  it('charges Bonus Time against net momentum', () => {
    const summary = summarizeActivation(
      input({ startingMomentum: 1, bonusTimeByAttack: [true, false] }),
    );

    expect(summary.netMomentumIfAllHit).toBe(1);

    expect(summary.netMomentumTooltip).toBe(
      '+2 from momentous results; -1 Bonus Time.',
    );
  });

  it('nets only the killing blow when no swing happens', () => {
    const summary = summarizeActivation(
      input({ attacks: [], killingBlowIndex: 0 }),
    );

    expect(summary.netMomentumIfAllHit).toBe(1);
  });

  it('itemizes Sweeping Charge on a charge that picks damage', () => {
    const attacker = makeAttacker({ characterTraits: [sweepingCharge] });
    const wrapPicks = [['two'], ['two']];
    const chargeRow = 0;

    const timeline = activationTimeline(
      { wrapPicks, characterPlayPicks: [[null], [null]] },
      {
        attacker,
        damageMods: NO_MODS,
        activeBaseCount: 2,
        chargeAttackIndex: chargeRow,
        targetHp: NEUTRAL_TARGET_HP,
      },
    );

    const rowDamageIfHit = rowDamageIfAllHit(
      attacker,
      wrapPicks,
      NO_MODS,
      2,
      timeline,
    );

    const summary = summarizeActivation(
      input({ attacker, wrapPicks, timeline, rowDamageIfHit }),
    );

    expect(summary.totalDamageIfAllHit).toBe(7);

    expect(summary.damageDealtTooltip).toBe(
      '4 from card pips; +3 Sweeping Charge = 7.',
    );
  });

  it('itemizes Tough Hide, buffs and activated traits', () => {
    const attacker = makeAttacker({
      characterTraits: [
        { id: 'gore', label: 'Gore', tooltip: '', active: true, flatDamage: 2 },
      ],
    });

    const summary = summarizeActivation(
      input({
        attacker,
        damageMods: modsWith({ toughHide: true, buffs: { sharp: true } }),
        activeTraits: { gore: true },
      }),
    );

    expect(summary.totalDamageIfAllHit).toBe(6);

    expect(summary.damageDealtTooltip).toBe(
      '4 from card pips; -2 Tough Hide; +2 Sharp; +2 Gore = 6.',
    );
  });

  it('explains when nothing deals damage', () => {
    const summary = summarizeActivation(input({ wrapPicks: [[null], [null]] }));

    expect(summary.damageDealtTooltip).toBe(
      'No selected playbook lines deal card damage to HP (after Tough Hide).',
    );
  });

  it('fails the plan unless every swing lands its line', () => {
    const summary = summarizeActivation(
      input({ attacks: [flaky(0, 0.5), flaky(1, 0.5)] }),
    );

    expect(summary.planFailureProbability).toBeCloseTo(0.75);
  });

  it('reports kill odds and the likely damage band', () => {
    const lethal = summarizeActivation(input({ targetHp: 4 }));
    const short = summarizeActivation(input({ targetHp: 5 }));

    expect(lethal.killProbability).toBe(1);
    expect(lethal.expectedDamage).toBe(4);
    expect(lethal.damageRange).toEqual({ low: 4, high: 4 });
    expect(short.killProbability).toBe(0);
    expect(short.expectedHpRemaining).toBe(1);
  });
});
