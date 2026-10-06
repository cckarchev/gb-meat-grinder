import { describe, expect, it } from 'vitest';
import { pickGeneratesMomentum } from '@/core/activation/momentousLines';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { rowDamageIfAllHit } from '@/core/damage/rowDamage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { wrapPickClearsCover } from '@/core/playbook/coverClearing';
import type { PlaybookDamageMods } from '@/core/playbook/playbook.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeRollParams,
  modsWith,
  NO_MODS,
  planOf,
  threeOf,
} from '@/core/testing/fixtures';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { cast } from '@/data/attackers/cast';
import { veteranCinder } from '@/data/attackers/veteranCinder';

/** Scenarios from PR #2, run against the real Blacksmiths data. */

const ACTIVE = 3;
const CHARGE_ROW = 0;
const ENEMY_DEF = 4;

type ScenarioOptions = {
  mods?: PlaybookDamageMods;
  armor?: number;
  chargeAttackIndex?: number;
  activeBaseCount?: number;
};

const rollParams = (
  attacker: AttackerData,
  options: ScenarioOptions,
): ActivationRollParams => {
  return makeRollParams({
    attacker,
    chargeAttackIndex: options.chargeAttackIndex ?? NO_ATTACK_INDEX,
    armor: options.armor ?? 0,
    damageMods: options.mods ?? NO_MODS,
    enemyDef: ENEMY_DEF,
    activeBaseCount: options.activeBaseCount ?? ACTIVE,
  });
};

const swingArmor = (
  attacker: AttackerData,
  plan: AttackPlan,
  options: ScenarioOptions,
): number[] => {
  const { attacks } = computeAttackSequence(
    plan,
    rollParams(attacker, options),
  );

  return attacks.map((attack) => attack.armor);
};

const allHitDamage = (
  attacker: AttackerData,
  plan: AttackPlan,
  options: ScenarioOptions = {},
): number[] => {
  const params = rollParams(attacker, options);
  const timeline = activationTimeline(plan, params);

  return rowDamageIfAllHit(
    attacker,
    plan.wrapPicks,
    params.damageMods,
    params.activeBaseCount,
    timeline,
  );
};

describe('Veteran Cinder and Searing Strike', () => {
  it('lowers ARM after the first damaging swing', () => {
    expect(swingArmor(veteranCinder, threeOf('dmg1'), { armor: 2 })).toEqual([
      2, 1, 1,
    ]);
  });

  it('does not sweep on a tackle charge, so Searing Strike waits', () => {
    const plan = planOf([['tackle'], ['dmg1'], ['dmg1']]);

    expect(
      swingArmor(veteranCinder, plan, {
        armor: 2,
        chargeAttackIndex: CHARGE_ROW,
      }),
    ).toEqual([2, 2, 1]);
  });

  it('sweeps on a zeroed damage charge, which lights Searing Strike', () => {
    const options: ScenarioOptions = {
      armor: 2,
      chargeAttackIndex: CHARGE_ROW,
      mods: modsWith({ toughHide: true }),
    };

    expect(swingArmor(veteranCinder, threeOf('dmg1'), options)).toEqual([
      2, 1, 1,
    ]);

    const sweepOnly = 3;

    expect(allHitDamage(veteranCinder, threeOf('dmg1'), options)[0]).toBe(
      sweepOnly,
    );
  });

  it('is one source with the pre-applied Searing Strike debuff', () => {
    const searing = modsWith({ buffs: { searingStrike: true } });
    const searingAndWeak = modsWith({
      buffs: { searingStrike: true, weakPoint: true },
    });

    expect(
      swingArmor(veteranCinder, threeOf('dmg1'), { armor: 3, mods: searing }),
    ).toEqual([2, 2, 2]);
    expect(
      swingArmor(veteranCinder, threeOf('dmg1'), {
        armor: 3,
        mods: searingAndWeak,
      }),
    ).toEqual([1, 1, 1]);
  });
});

describe('Cast and Tempered Steel', () => {
  const steel = modsWith({ buffs: { temperedSteel: true } });

  it('adds TAC from the first swing and grants Searing Strike', () => {
    const { attacks } = computeAttackSequence(
      threeOf('dmg1'),
      rollParams(cast, { armor: 2, mods: steel }),
    );

    const steelTac = cast.tac + 1;

    expect(attacks[0].tac).toBe(steelTac);
    expect(attacks.map((attack) => attack.armor)).toEqual([2, 1, 1]);
  });

  it('feeds Burning Passion once Searing Strike lights the target', () => {
    const steelAndBurning = modsWith({
      targetBurning: true,
      buffs: { temperedSteel: true },
    });

    expect(allHitDamage(cast, threeOf('dmg1'), { mods: steel })).toEqual([
      1, 2, 2,
    ]);
    expect(
      allHitDamage(cast, threeOf('dmg1'), { mods: steelAndBurning }),
    ).toEqual([2, 2, 2]);
    expect(allHitDamage(cast, threeOf('dmg1'))).toEqual([1, 1, 1]);
  });

  it('stacks Burning Passion with Tooled Up', () => {
    const single = { activeBaseCount: 1 };
    const plan = planOf([['two_gb']]);

    expect(
      allHitDamage(cast, plan, {
        ...single,
        mods: modsWith({ targetBurning: true, buffs: { tooledUp: true } }),
      })[0],
    ).toBe(4);
    expect(
      allHitDamage(cast, plan, {
        ...single,
        mods: modsWith({ buffs: { tooledUp: true } }),
      })[0],
    ).toBe(3);
  });
});

describe('Cast plays', () => {
  it('applies Shield Glare once however often it is picked', () => {
    const plan = planOf(
      [['two_gb'], ['gb_push_dodge'], ['dmg1']],
      [['shieldGlare'], ['shieldGlare'], [null]],
    );

    const timeline = activationTimeline(plan, rollParams(cast, {}));

    expect(timeline[2].effectsBefore.defReduction).toBe(1);
  });

  it('clears cover on her push results', () => {
    expect(wrapPickClearsCover(cast, 'push_dodge')).toBe(true);
    expect(wrapPickClearsCover(cast, 'gb_push_dodge')).toBe(true);
  });
});

describe('Veteran Cinder Impale', () => {
  const impaleOnce = planOf([['gb']], [['impale']]);
  const single = { activeBaseCount: 1 };

  const impaleDamage = (mods: PlaybookDamageMods): number => {
    return allHitDamage(veteranCinder, impaleOnce, { ...single, mods })[0];
  };

  it('is modified like playbook damage', () => {
    expect(impaleDamage(NO_MODS)).toBe(3);
    expect(impaleDamage(modsWith({ toughHide: true }))).toBe(2);
    expect(impaleDamage(modsWith({ buffs: { tooledUp: true } }))).toBe(4);
    expect(
      impaleDamage(modsWith({ toughHide: true, buffs: { tooledUp: true } })),
    ).toBe(3);
  });

  it('deals damage once per turn', () => {
    const twice = planOf([['gb'], ['gb']], [['impale'], ['impale']]);

    expect(allHitDamage(veteranCinder, twice, { activeBaseCount: 2 })).toEqual([
      3, 0,
    ]);
  });
});

describe('Blacksmiths momentum', () => {
  const toughHide = modsWith({ toughHide: true });

  it('earns momentum on damageless momentous results under Tough Hide', () => {
    expect(pickGeneratesMomentum(veteranCinder, 'gb', toughHide)).toBe(true);
    expect(
      pickGeneratesMomentum(veteranCinder, 'double_dodge_m', toughHide),
    ).toBe(true);
    expect(pickGeneratesMomentum(veteranCinder, 'dmg1', toughHide)).toBe(false);
  });

  it('never earns momentum on a non-momentous result', () => {
    expect(pickGeneratesMomentum(cast, 'dmg1', NO_MODS)).toBe(false);
  });
});
