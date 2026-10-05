import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import { activeBaseAttackCount } from '@/core/attacks/attackStructure';
import { rowDamageIfAllHit } from '@/core/playbook/rowDamage';
import { HP_MIN, NO_ATTACK_INDEX } from '@/core/shared/constants';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';
import {
  initialState,
  PICK_VETERAN_BOAR,
  pick,
  reduce,
} from '@/gbMeatGrinder/reducer/reducerTestHelpers';

const boarState = (...actions: MeatGrinderAction[]): MeatGrinderState => {
  return reduce(initialState(PICK_VETERAN_BOAR), ...actions);
};

const pickDamage = (attackIndex: number): MeatGrinderAction => {
  return pick(attackIndex, 'dmg1');
};

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

    const expected = computeAttackSequence(state.attackPlan, {
      attacker: veteranBoar,
      chargeAttackIndex: NO_ATTACK_INDEX,
      armor: state.armor,
      enemyHasCover: state.enemyHasCover,
      enemyDefensiveStance: state.enemyDefensiveStance,
      damageMods: state.damageMods,
      enemyDef: 3,
      bonusTimeByAttack: state.bonusTimeByAttack,
      initialTacModifier: 0,
      activeBaseCount,
    });

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

    expect(idle.effectiveChargeAttackIndex).toBe(NO_ATTACK_INDEX);
    expect(charging.effectiveChargeAttackIndex).toBe(0);
  });

  it('nets ganging up against crowding out', () => {
    const state = boarState(
      { type: 'gangingUp', value: 2 },
      { type: 'crowdingOut', value: 1 },
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
    const state = boarState(pickDamage(0));
    const derived = deriveSimulation(veteranBoar, state);

    expect(derived.ignoredAttackIndex).toBe(NO_ATTACK_INDEX);
    expect(derived.ignoredDisplayIndex).toBe(NO_ATTACK_INDEX);
    expect(derived.effectiveWrapPicks).toEqual(state.attackPlan.wrapPicks);
  });

  it('finds the killing blow under the all-hit projection', () => {
    const fragile = boarState({ type: 'hp', value: HP_MIN }, pickDamage(0));

    const unpicked = boarState({ type: 'hp', value: HP_MIN });

    expect(deriveSimulation(veteranBoar, fragile).killingBlowIndex).toBe(0);
    expect(deriveSimulation(veteranBoar, unpicked).killingBlowIndex).toBe(
      NO_ATTACK_INDEX,
    );
  });

  it('exposes the all-hit row damage and flat damage it projects with', () => {
    const state = boarState(pickDamage(0));
    const derived = deriveSimulation(veteranBoar, state);

    const expectedRowDamage = rowDamageIfAllHit(
      veteranBoar,
      derived.effectiveWrapPicks,
      state.damageMods,
      derived.activeBaseCount,
    );

    expect(derived.rowDamageIfHit).toEqual(expectedRowDamage);
    expect(derived.flatDamage).toBe(0);
  });
});
