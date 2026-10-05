import { attackArraySize } from '@/core/attacks/attackStructure';
import { createInitialAttackPlan } from '@/core/plan/initialAttackPlan';
import { clamp } from '@/core/shared/clamp';
import { ARM_DEFAULT, DEF_DEFAULT, HP_DEFAULT } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { randomAttacker } from '@/data/attackers/registry';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';

/** Fresh attacker-side state for a model, preserving enemy stats from `prev`. */
export const stateForAttacker = (
  attacker: AttackerData,
  prev?: Partial<MeatGrinderState>,
): MeatGrinderState => {
  const influence = attacker.inf;
  // Models with a free charge (Furious) default to charging; otherwise carry
  // over the prior toggle (or off for a fresh state).
  const charging = attacker.furious ? true : (prev?.charging ?? false);

  const startingMomentum = clamp(
    prev?.startingMomentum ?? 0,
    attacker.startingMomentum.min,
    attacker.startingMomentum.max,
  );

  const gangingUp = clamp(
    prev?.gangingUp ?? 0,
    attacker.gangingUp.min,
    attacker.gangingUp.max,
  );

  const crowdingOut = clamp(
    prev?.crowdingOut ?? 0,
    attacker.crowdingOut.min,
    attacker.crowdingOut.max,
  );

  const bonusTimeByAttack = Array.from(
    { length: attackArraySize(attacker) },
    () => false,
  );

  return {
    attackerId: attacker.id,
    enemyDef: prev?.enemyDef ?? DEF_DEFAULT,
    armor: prev?.armor ?? ARM_DEFAULT,
    hp: prev?.hp ?? HP_DEFAULT,
    influence,
    charging,
    chargeAttackIndex: 0,
    enemyHasCover: prev?.enemyHasCover ?? false,
    enemyDefensiveStance: prev?.enemyDefensiveStance ?? false,
    enemyKnockedDown: prev?.enemyKnockedDown ?? false,
    enemySnared: prev?.enemySnared ?? false,
    enemyResilience: prev?.enemyResilience ?? false,
    startingMomentum,
    gangingUp,
    crowdingOut,
    bonusTimeByAttack,
    damageMods: { toughHide: prev?.damageMods?.toughHide ?? false, buffs: {} },
    specialAbilities: {},
    attackPlan: createInitialAttackPlan(attacker, influence, charging),
  };
};

export const createInitialMeatGrinderState = (): MeatGrinderState => {
  return stateForAttacker(randomAttacker());
};
