import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import {
  pickUiEngineResults,
  UI_ENGINE_RESULT_KEYS,
} from '@/gbMeatGrinder/uiEngineResults';

describe('pickUiEngineResults', () => {
  it('copies exactly the engine results the UI reads', () => {
    const derived = deriveSimulation(
      veteranBoar,
      stateForAttacker(veteranBoar),
    );

    const uiResults = pickUiEngineResults(derived);

    expect(Object.keys(uiResults).sort()).toEqual(
      [...UI_ENGINE_RESULT_KEYS].sort(),
    );

    for (const key of UI_ENGINE_RESULT_KEYS) {
      expect(uiResults[key]).toBe(derived[key]);
    }
  });
});
