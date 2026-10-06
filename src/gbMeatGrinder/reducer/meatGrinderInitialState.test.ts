import { describe, expect, it, vi } from 'vitest';
import { ATTACKERS } from '@/data/attackers/registry';
import {
  createInitialMeatGrinderState,
  stateForAttacker,
} from '@/gbMeatGrinder/reducer/meatGrinderInitialState';

describe('createInitialMeatGrinderState', () => {
  it('starts on a random model with its fresh state', () => {
    const lastIndex = ATTACKERS.length - 1;
    const justBelowOne = 0.999;

    vi.spyOn(Math, 'random').mockReturnValueOnce(justBelowOne);

    expect(createInitialMeatGrinderState()).toEqual(
      stateForAttacker(ATTACKERS[lastIndex]),
    );
  });
});
