/** The empty plan a model starts with, clamped against default enemy stats. */

import type { AttackerData } from "@/data/attackers/attacker.types";
import {
  activeBaseAttackCount,
  attackArraySize,
} from "../attacks/attackStructure";
import { DEFAULT_PLAYBOOK_DAMAGE_MODS } from "../damage/damage";
import {
  defaultCharacterPlayPicks,
  defaultWrapPicks,
} from "../playbook/wrapSlots";
import {
  ARM_DEFAULT,
  DEF_DEFAULT,
  HP_DEFAULT,
  NO_ATTACK_INDEX,
} from "../shared/constants";
import type { AttackPlan } from "./attackPlan.types";
import { clampAttackPlan } from "./clampAttackPlan";

export const createInitialAttackPlan = (
  attacker: AttackerData,
  influence: number,
  charging: boolean,
): AttackPlan => {
  const size = attackArraySize(attacker);

  const unclamped: AttackPlan = {
    wrapPicks: defaultWrapPicks(size),
    characterPlayPicks: defaultCharacterPlayPicks(size),
  };

  const noBonusTime = Array.from({ length: size }, () => false);

  return clampAttackPlan(unclamped, {
    attacker,
    chargeAttackIndex: charging ? 0 : NO_ATTACK_INDEX,
    armor: ARM_DEFAULT,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    damageMods: DEFAULT_PLAYBOOK_DAMAGE_MODS,
    enemyDef: DEF_DEFAULT,
    bonusTimeByAttack: noBonusTime,
    initialTacModifier: 0,
    enemyKnockedDown: false,
    activeBaseCount: activeBaseAttackCount(attacker, influence, charging),
    targetHp: HP_DEFAULT,
  });
};
