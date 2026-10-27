import type { ActivationScenario } from "@/core/activation/simulation.types";
import type {
  CharacterPlayPick,
  PlaybookChoiceId,
} from "@/core/playbook/playbook.types";

/** The engine's scenario plus what only the app tracks. */
export type MeatGrinderState = ActivationScenario & {
  /** Id of the selected attacker model (see attacker registry). */
  attackerId: string;
  startingMomentum: number;
};

/** Actions that set one number and carry nothing else. */
export type NumberActionType =
  | "enemyDef"
  | "armor"
  | "hp"
  | "influence"
  | "chargeAttackIndex"
  | "startingMomentum"
  | "gangingUp"
  | "crowdingOut";

/** Actions that set one flag and carry nothing else. */
export type BooleanActionType =
  | "charging"
  | "enemyHasCover"
  | "enemyDefensiveStance"
  | "enemyKnockedDown"
  | "enemySnared"
  | "enemyResilience"
  | "toughHide"
  | "targetBurning"
  | "assistEngaged";

/**
 * One action per type in `T`, so a switch on `type` narrows each case to
 * its own action.
 */
type ValueAction<T extends string, V> = T extends string
  ? { type: T; value: V }
  : never;

export type MeatGrinderAction =
  | { type: "reset" }
  | { type: "selectAttacker"; id: string }
  | ValueAction<NumberActionType, number>
  | ValueAction<BooleanActionType, boolean>
  | { type: "guildBuff"; id: string; value: boolean }
  | { type: "activeTrait"; id: string; value: boolean }
  | { type: "bonusTime"; attackIndex: number; value: boolean }
  | {
      type: "wrapChoice";
      attackIndex: number;
      pickIndex: number;
      id: PlaybookChoiceId | null;
    }
  | { type: "clearWrapContinuation"; attackIndex: number }
  | {
      type: "characterPlayPick";
      attackIndex: number;
      pickIndex: number;
      pick: CharacterPlayPick;
    };
