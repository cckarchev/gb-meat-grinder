import { describe, expect, it } from 'vitest';
import { toBase64Url } from '@/core/shared/base64Url';
import { HP_MAX } from '@/core/shared/constants';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { pick, reduce } from '@/gbMeatGrinder/reducer/reducerTestHelpers';
import { stateFromShareParams } from '@/gbMeatGrinder/share/shareReplay';
import {
  SHARE_MODEL_PARAM,
  SHARE_STATE_PARAM,
  shareParamsOf,
} from '@/gbMeatGrinder/share/shareWire';

const paramsWith = (model: string, encoded: string): URLSearchParams => {
  return new URLSearchParams({
    [SHARE_MODEL_PARAM]: model,
    [SHARE_STATE_PARAM]: encoded,
  });
};

const encodeWire = (wire: unknown): string => {
  return toBase64Url(JSON.stringify(wire));
};

describe('state from share params', () => {
  it('round-trips a fresh state', () => {
    const state = stateForAttacker(thresher);

    expect(stateFromShareParams(shareParamsOf(state))).toEqual(state);
  });

  it('round-trips enemy stats, conditions, toggles and the plan', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'enemyDef', value: 5 },
      { type: 'armor', value: 2 },
      { type: 'hp', value: 9 },
      { type: 'enemyHasCover', value: true },
      { type: 'enemyDefensiveStance', value: true },
      { type: 'enemySnared', value: true },
      { type: 'enemyResilience', value: true },
      { type: 'toughHide', value: true },
      { type: 'targetBurning', value: true },
      { type: 'guildBuff', id: 'weakPoint', value: true },
      { type: 'activeTrait', id: 'dontFearTheReaper', value: true },
      { type: 'gangingUp', value: 5 },
      { type: 'startingMomentum', value: 1 },
      pick(0, 'm4'),
      pick(0, 'm2', 1),
      { type: 'bonusTime', attackIndex: 0, value: true },
      { type: 'bonusTime', attackIndex: 1, value: true },
      pick(1, 'three_gb'),
    );

    expect(stateFromShareParams(shareParamsOf(state))).toEqual(state);
  });

  it('round-trips a charge and its character play pick', () => {
    const state = reduce(
      stateForAttacker(veteranBoar),
      { type: 'chargeAttackIndex', value: 1 },
      { type: 'enemyKnockedDown', value: true },
      { type: 'crowdingOut', value: 1 },
      pick(0, 'gb'),
      {
        type: 'characterPlayPick',
        attackIndex: 0,
        pickIndex: 0,
        pick: 'stagger',
      },
    );

    expect(stateFromShareParams(shareParamsOf(state))).toEqual(state);
  });

  it('returns null without a model or for an unknown one', () => {
    const encoded = shareParamsOf(stateForAttacker(thresher)).get(
      SHARE_STATE_PARAM,
    );

    expect(stateFromShareParams(new URLSearchParams())).toBeNull();
    expect(
      stateFromShareParams(paramsWith('nobody', encoded ?? '')),
    ).toBeNull();
  });

  it('falls back to the model defaults for a missing or corrupt blob', () => {
    const defaults = stateForAttacker(thresher);
    const modelOnly = new URLSearchParams({
      [SHARE_MODEL_PARAM]: thresher.id,
    });

    expect(stateFromShareParams(modelOnly)).toEqual(defaults);
    expect(stateFromShareParams(paramsWith(thresher.id, '!!'))).toEqual(
      defaults,
    );
    expect(
      stateFromShareParams(paramsWith(thresher.id, toBase64Url('{oops'))),
    ).toEqual(defaults);
    expect(
      stateFromShareParams(paramsWith(thresher.id, encodeWire({ v: 99 }))),
    ).toEqual(defaults);
  });

  it('clamps out-of-range numbers and ignores values of the wrong type', () => {
    const wire = {
      v: 1,
      d: 'five',
      a: 99,
      h: 999,
      i: -4,
      c: 'yes',
      g: 50,
    };

    const state = stateFromShareParams(
      paramsWith(thresher.id, encodeWire(wire)),
    );
    const defaults = stateForAttacker(thresher);

    expect(state).toMatchObject({
      enemyDef: defaults.enemyDef,
      armor: 6,
      hp: HP_MAX,
      influence: 0,
      charging: false,
      gangingUp: thresher.gangingUp.max,
    });
  });

  it('drops picks, buffs and traits the model does not have', () => {
    const wire = {
      v: 1,
      b: ['weakPoint', 'notABuff'],
      t: ['notATrait'],
      w: [['notALine'], ['m2', 'm2', 'm2']],
    };

    const state = stateFromShareParams(
      paramsWith(thresher.id, encodeWire(wire)),
    );
    const withBuff = reduce(stateForAttacker(thresher), {
      type: 'guildBuff',
      id: 'weakPoint',
      value: true,
    });

    expect(state?.damageMods.buffs).toEqual({ weakPoint: true });
    expect(state?.activeTraits).toEqual({});
    expect(state?.attackPlan.wrapPicks[0]).toEqual(
      withBuff.attackPlan.wrapPicks[0],
    );
    expect(state?.attackPlan.wrapPicks[1]).toEqual(['m2', 'm2']);
  });

  it('keeps the default character play when the shared one is unknown', () => {
    const wire = { v: 1, w: [['three_gb']], p: [['notAPlay']] };

    const state = stateFromShareParams(
      paramsWith(thresher.id, encodeWire(wire)),
    );

    expect(state?.attackPlan.characterPlayPicks[0]).toEqual(['theyAintTough']);
  });
});
