/** Roll context and hit odds for every swing in the activation. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import type {
  ActivationRollParams,
  AttackRollContext,
} from '@/core/attacks/attackSequence.types';
import { armorForAttackRow } from '@/core/attacks/swingDefense';
import { swingTacAndDef } from '@/core/attacks/swingTac';
import {
  hitProbabilityPerDie,
  probAttackSucceeds,
} from '@/core/damage/probability';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { wrapNetThresholdAllHits } from '@/core/playbook/wrapSlots';

export const computeAttackSequence = (
  plan: AttackPlan,
  params: ActivationRollParams,
): { attacks: AttackRollContext[] } => {
  const { wrapPicks, characterPlayPicks } = plan;
  const { attacker, armor, damageMods, activeBaseCount } = params;

  const attacks: AttackRollContext[] = [];

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  for (const attackIndex of order) {
    const { tac, defMinRoll } = swingTacAndDef(plan, attackIndex, params);

    const rowArmor = armorForAttackRow(
      attacker,
      armor,
      wrapPicks,
      characterPlayPicks,
      damageMods,
      attackIndex,
      activeBaseCount,
    );

    const pHit = hitProbabilityPerDie(defMinRoll);
    const netSuccessesNeeded = wrapNetThresholdAllHits(
      attacker,
      wrapPicks[attackIndex],
    );

    const prob = probAttackSucceeds(tac, pHit, rowArmor, netSuccessesNeeded);

    attacks.push({
      attackIndex,
      tac,
      armor: rowArmor,
      defMinRoll,
      pHit,
      netSuccessesNeeded,
      prob,
    });
  }

  return { attacks };
};
