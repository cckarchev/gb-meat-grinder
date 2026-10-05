import type { ActivationScenario } from '@/core/activation/simulation.types';
import type {
  CharacterPlayPick,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';

/** The engine's scenario plus what only the app tracks. */
export type MeatGrinderState = ActivationScenario & {
  /** Id of the selected attacker model (see attacker registry). */
  attackerId: string;
  startingMomentum: number;
};

export type MeatGrinderAction =
  | { type: 'reset' }
  | { type: 'selectAttacker'; id: string }
  | { type: 'enemyDef'; value: number }
  | { type: 'armor'; value: number }
  | { type: 'hp'; value: number }
  | { type: 'influence'; value: number }
  | { type: 'charging'; value: boolean }
  | { type: 'chargeAttackIndex'; value: number }
  | { type: 'enemyHasCover'; value: boolean }
  | { type: 'enemyDefensiveStance'; value: boolean }
  | { type: 'enemyKnockedDown'; value: boolean }
  | { type: 'enemySnared'; value: boolean }
  | { type: 'enemyResilience'; value: boolean }
  | { type: 'startingMomentum'; value: number }
  | { type: 'gangingUpRaw'; value: number }
  | { type: 'crowdingOutRaw'; value: number }
  | { type: 'damageMods'; value: PlaybookDamageMods }
  | { type: 'specialAbility'; id: string; value: boolean }
  | { type: 'bonusTime'; attackIndex: number; value: boolean }
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
