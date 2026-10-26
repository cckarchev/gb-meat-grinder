import type { AttackerData } from "@/data/attackers/attacker.types";
import type { PlaybookDamageMods, WrapPick } from "../playbook/playbook.types";

/** Everything the momentum pool depends on across one activation. */
export type MomentumParams = {
  attacker: AttackerData;
  wrapPicks: WrapPick[][];
  damageMods: PlaybookDamageMods;
  startingMomentum: number;
  bonusTimeByAttack: readonly boolean[];
  activeBaseCount: number;
};
