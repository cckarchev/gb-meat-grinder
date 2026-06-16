import type { AttackPlan } from '@/types/core/attackPlan';
import type {
  CharacterPlayPick,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/types/core/playbook';

export type MeatGrinderState = {
  /** Id of the selected attacker model (see attacker registry). */
  attackerId: string;
  enemyDef: number;
  armor: number;
  hp: number;
  /** Influence allocated to the attacker this activation (0…attacker INF cap). */
  influence: number;
  /** Whether the attacker charges (costs influence unless Furious). */
  charging: boolean;
  /** Which base attack is the charge, when charging. */
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  startingMomentum: number;
  initialTacModifier: number;
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  /** Toggled model-specific flat-damage abilities, by ability id. */
  specialAbilities: Record<string, boolean>;
  attackPlan: AttackPlan;
};

export type MeatGrinderAction =
  | { type: 'selectAttacker'; id: string }
  | { type: 'enemyDef'; value: number }
  | { type: 'armor'; value: number }
  | { type: 'hp'; value: number }
  | { type: 'influence'; value: number }
  | { type: 'charging'; value: boolean }
  | { type: 'chargeAttackIndex'; value: number }
  | { type: 'enemyHasCover'; value: boolean }
  | { type: 'enemyDefensiveStance'; value: boolean }
  | { type: 'startingMomentum'; value: number }
  | { type: 'initialTacModifierRaw'; value: number }
  | { type: 'damageMods'; value: PlaybookDamageMods }
  | { type: 'specialAbility'; id: string; value: boolean }
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
