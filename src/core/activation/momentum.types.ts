import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Everything the momentum pool depends on across one activation. */
export type MomentumParams = {
  attacker: AttackerData;
  wrapPicks: WrapPick[][];
  damageMods: PlaybookDamageMods;
  startingMomentum: number;
  bonusTimeByAttack: readonly boolean[];
  activeBaseCount: number;
};
