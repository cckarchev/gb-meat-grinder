import type { AttackPlan } from '@/types/core/attackPlan';
import type {
  CharacterPlayPick,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/types/core/playbook';

export type MeatGrinderState = {
  enemyDef: number;
  armor: number;
  hp: number;
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  startingMomentum: number;
  initialTacModifier: number;
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  attackPlan: AttackPlan;
};

export type MeatGrinderAction =
  | { type: 'enemyDef'; value: number }
  | { type: 'armor'; value: number }
  | { type: 'hp'; value: number }
  | { type: 'chargeAttackIndex'; value: number }
  | { type: 'enemyHasCover'; value: boolean }
  | { type: 'enemyDefensiveStance'; value: boolean }
  | { type: 'startingMomentum'; value: number }
  | { type: 'initialTacModifierRaw'; value: number }
  | { type: 'damageMods'; value: PlaybookDamageMods }
  | { type: 'bonusTime'; attackIndex: number; value: boolean }
  | { type: 'sanitizeBonusTime' }
  | {
      type: 'wrapChoice';
      attackIndex: number;
      pickIndex: number;
      id: PlaybookChoiceId | null;
    }
  | { type: 'clearWrapContinuation'; attackIndex: number }
  | {
      type: 'characterPlayPick';
      attackIndex: number;
      pickIndex: number;
      pick: CharacterPlayPick;
    };
