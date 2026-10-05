import { afterEach, describe, expect, it, vi } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import { activeBaseAttackCount } from '@/core/attacks/attackStructure';
import { HP_MIN } from '@/core/shared/constants';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer.types';

/** `Math.random` value that makes `randomAttacker` pick the Veteran Boar. */
const PICK_VETERAN_BOAR = 0;

const boarState = (...actions: MeatGrinderAction[]): MeatGrinderState => {
  vi.spyOn(Math, 'random').mockReturnValue(PICK_VETERAN_BOAR);

  return actions.reduce(meatGrinderReducer, createInitialMeatGrinderState());
};

const pickDamage = (attackIndex: number): MeatGrinderAction => {
  return { type: 'wrapChoice', attackIndex, pickIndex: 0, id: 'dmg1' };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deriveSimulation', () => {
  it('runs the attack sequence on the effective enemy stats', () => {
    const state = boarState(
      { type: 'charging', value: false },
      { type: 'enemyDef', value: 5 },
      { type: 'enemyKnockedDown', value: true },
      { type: 'enemySnared', value: true },
      pickDamage(0),
    );

    const derived = deriveSimulation(veteranBoar, state);

    const activeBaseCount = activeBaseAttackCount(
      veteranBoar,
      state.influence,
      state.charging,
    );

    const expected = computeAttackSequence(
      veteranBoar,
      3,
      state.armor,
      state.attackPlan.wrapPicks,
      state.attackPlan.characterPlayPicks,
      -1,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      state.bonusTimeByAttack,
      0,
      activeBaseCount,
    );

    expect(derived.effectiveEnemyDef).toBe(3);
    expect(derived.activeBaseCount).toBe(activeBaseCount);
    expect(derived.attacks).toEqual(expected.attacks);
  });

  it('uses no charge row unless charging', () => {
    const idle = deriveSimulation(
      veteranBoar,
      boarState({ type: 'charging', value: false }),
    );

    const charging = deriveSimulation(
      veteranBoar,
      boarState({ type: 'charging', value: true }),
    );

    expect(idle.effectiveChargeAttackIndex).toBe(-1);
    expect(charging.effectiveChargeAttackIndex).toBe(0);
  });

  it('nets ganging up against crowding out', () => {
    const state = boarState(
      { type: 'gangingUpRaw', value: 2 },
      { type: 'crowdingOutRaw', value: 1 },
    );

    expect(deriveSimulation(veteranBoar, state).initialTacModifier).toBe(1);
  });

  it('blanks the first swing for a resilient target', () => {
    const state = boarState(pickDamage(0), {
      type: 'enemyResilience',
      value: true,
    });

    const derived = deriveSimulation(veteranBoar, state);

    expect(derived.ignoredDisplayIndex).toBe(0);
    expect(derived.effectiveWrapPicks[0].every((id) => id == null)).toBe(true);
    expect(state.attackPlan.wrapPicks[0][0]).toBe('dmg1');
  });

  it('ignores no swing for a regular target', () => {
    const derived = deriveSimulation(veteranBoar, boarState(pickDamage(0)));

    expect(derived.ignoredAttackIndex).toBe(-1);
    expect(derived.ignoredDisplayIndex).toBe(-1);
    expect(derived.effectiveWrapPicks).toEqual(
      boarState(pickDamage(0)).attackPlan.wrapPicks,
    );
  });

  it('finds the killing blow under the all-hit projection', () => {
    const fragile = boarState({ type: 'hp', value: HP_MIN }, pickDamage(0));

    const unpicked = boarState({ type: 'hp', value: HP_MIN });

    expect(deriveSimulation(veteranBoar, fragile).killingBlowIndex).toBe(0);
    expect(deriveSimulation(veteranBoar, unpicked).killingBlowIndex).toBe(-1);
  });
});
