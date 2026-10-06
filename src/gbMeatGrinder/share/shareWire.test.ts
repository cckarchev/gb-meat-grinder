import { describe, expect, it } from 'vitest';
import { fromBase64Url } from '@/core/shared/base64Url';
import { thresher } from '@/data/attackers/thresher';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { pick, reduce } from '@/gbMeatGrinder/reducer/reducerTestHelpers';
import {
  SHARE_MODEL_PARAM,
  SHARE_STATE_PARAM,
  shareParamsOf,
} from '@/gbMeatGrinder/share/shareWire';

const decodedWireOf = (params: URLSearchParams): unknown => {
  const json = fromBase64Url(params.get(SHARE_STATE_PARAM) ?? '');

  return JSON.parse(json ?? 'null');
};

describe('share params', () => {
  it('names the model in plain text', () => {
    const state = reduce(stateForAttacker(thresher), { type: 'hp', value: 9 });
    const params = shareParamsOf(state);

    expect(params.get(SHARE_MODEL_PARAM)).toBe(thresher.id);
    expect(params.get(SHARE_STATE_PARAM)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('shares only the model when every choice is a default', () => {
    const params = shareParamsOf(stateForAttacker(thresher));

    expect(params.toString()).toBe(`${SHARE_MODEL_PARAM}=${thresher.id}`);
  });

  it('encodes only the choices that differ from the model defaults', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'hp', value: 9 },
      { type: 'enemyHasCover', value: true },
    );

    expect(decodedWireOf(shareParamsOf(state))).toEqual({
      v: 1,
      h: 9,
      cv: true,
    });
  });

  it('drops trailing attacks left at their defaults', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'gangingUp', value: 5 },
      pick(0, 'm4'),
      pick(0, 'm2', 1),
    );

    expect(decodedWireOf(shareParamsOf(state))).toEqual({
      v: 1,
      g: 5,
      w: [['m4', 'm2']],
    });
  });

  it('drops empty slots at the end of a wrap row', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'gangingUp', value: 5 },
      pick(0, 'm4'),
    );

    expect(state.attackPlan.wrapPicks[0].length).toBeGreaterThan(1);
    expect(decodedWireOf(shareParamsOf(state))).toEqual({
      v: 1,
      g: 5,
      w: [['m4']],
    });
  });
});
