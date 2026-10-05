/** Roll context and hit odds for every swing in the activation. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { armorForAttackRow } from '@/core/attacks/swingDefense';
import { swingTacAndDef } from '@/core/attacks/swingTac';
import {
  hitProbabilityPerDie,
  probAttackSucceeds,
} from '@/core/damage/probability';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { wrapNetThresholdAllHits } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const computeAttackSequence = (
  attacker: AttackerData,
  baseDef: number,
  armor: number,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  chargeAttackIndex: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
  activeBaseCount: number,
): { attacks: AttackRollContext[] } => {
  const attacks: AttackRollContext[] = [];

  for (const i of activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  )) {
    const { tac, defMinRoll } = swingTacAndDef(
      attacker,
      wrapPicks,
      characterPlayPicks,
      i,
      chargeAttackIndex,
      enemyHasCover,
      enemyDefensiveStance,
      damageMods,
      baseDef,
      bonusTimeByAttack,
      initialTacModifier,
      activeBaseCount,
    );

    const rowArmor = armorForAttackRow(
      attacker,
      armor,
      wrapPicks,
      characterPlayPicks,
      damageMods,
      i,
      activeBaseCount,
    );

    const pHit = hitProbabilityPerDie(defMinRoll);
    const need = wrapNetThresholdAllHits(attacker, wrapPicks[i]);
    const prob = probAttackSucceeds(tac, pHit, rowArmor, need);

    attacks.push({
      attackIndex: i,
      tac,
      armor: rowArmor,
      defMinRoll,
      pHit,
      netSuccessesNeeded: need,
      prob,
    });
  }

  return { attacks };
};
