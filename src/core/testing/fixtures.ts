import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { DEFAULT_PLAYBOOK_DAMAGE_MODS } from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlay,
  CharacterPlayPickSlot,
  PlaybookColumn,
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { DEF_DEFAULT, NO_ATTACK_INDEX } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { searingStrike } from '@/data/characterTraits';
import type { Guild } from '@/data/guilds/guild.types';

/**
 * Synthetic model for core tests. Its playbook is small and every result has a
 * distinct effect, so expected values can be worked out by hand:
 *
 * - net 1: `one` (1 dmg, momentous), `dodge` (0 dmg)
 * - net 2: `push` (clears cover), `two` (2 dmg, momentous)
 * - net 3: `gb` (1GB, picks a character play), `kd` (Knock Down with a
 *   dodge, -1 DEF later)
 * - net 4: `four` (4 dmg, momentous)
 */

const result = (
  overrides: Partial<PlaybookResult> & Pick<PlaybookResult, 'id' | 'label'>,
): PlaybookResult => {
  return {
    damage: 0,
    ...overrides,
  };
};

export const TEST_PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      result({ id: 'one', label: '1', damage: 1, momentum: true }),
      result({ id: 'dodge', label: '<' }),
    ],
  },
  {
    netSuccesses: 2,
    results: [
      result({ id: 'push', label: '>', clearsCover: true }),
      result({ id: 'two', label: '2', damage: 2, momentum: true }),
    ],
  },
  {
    netSuccesses: 3,
    results: [
      result({ id: 'gb', label: '1GB', damage: 1, picksCharacterPlay: true }),
      result({
        id: 'kd',
        label: 'KD',
        defReductionForLater: 1,
        appliesKnockDown: true,
        dodge: true,
      }),
    ],
  },
  {
    netSuccesses: 4,
    results: [result({ id: 'four', label: '4', damage: 4, momentum: true })],
  },
];

export const TEST_GUILD: Guild = {
  id: 'testers',
  name: 'Testers',
  color: '#123456',
  buffs: [
    { id: 'sharp', label: 'Sharp', tooltip: '', damageBonus: 1 },
    { id: 'sunder', label: 'Sunder', tooltip: '', armorReduction: 1 },
    {
      id: 'condition',
      label: 'Condition',
      tooltip: '',
      ignoresToughHide: true,
    },
  ],
};

/** A guild with condition-driven buffs: Tempered Steel-like and Searing Strike. */
export const CONDITION_GUILD: Guild = {
  id: 'conditioners',
  name: 'Conditioners',
  color: '#654321',
  buffs: [
    {
      id: 'steel',
      label: 'Steel',
      tooltip: '',
      tacBonus: 1,
      grantsTraits: [searingStrike],
    },
    {
      id: 'searingStrike',
      label: 'Searing Strike',
      tooltip: '',
      target: 'enemy',
      armorReduction: 1,
    },
    { id: 'sharp', label: 'Sharp', tooltip: '', damageBonus: 1 },
  ],
};

export const PLAY_TAC: CharacterPlay = {
  id: 'playTac',
  label: 'Play TAC',
  tacBonusForLater: 2,
  oncePerTurn: true,
};

export const PLAY_DEF: CharacterPlay = {
  id: 'playDef',
  label: 'Play DEF',
  defReductionForLater: 1,
  oncePerTurn: true,
};

export const PLAY_ARM: CharacterPlay = {
  id: 'playArm',
  label: 'Play ARM',
  armorReduction: 1,
  oncePerTurn: true,
};

export const PLAY_REPEATABLE: CharacterPlay = {
  id: 'playRepeatable',
  label: 'Play Repeatable',
  tacBonusForLater: 1,
  oncePerTurn: false,
};

export const PLAY_NOOP: CharacterPlay = {
  id: 'playNoop',
  label: 'Play Noop',
  oncePerTurn: true,
};

export const PLAY_DAMAGE: CharacterPlay = {
  id: 'playDamage',
  label: 'Play Damage',
  damage: 3,
  oncePerTurn: true,
};

export const makeAttacker = (
  overrides: Partial<AttackerData> = {},
): AttackerData => {
  return {
    id: 'tester',
    name: 'Tester',
    tac: 6,
    inf: 2,
    furious: false,
    berserker: false,
    feral: false,
    playbook: TEST_PLAYBOOK,
    guild: TEST_GUILD,
    characterPlays: [PLAY_TAC, PLAY_DEF],
    startingMomentum: STARTING_MOMENTUM_RANGE,
    gangingUp: GANGING_UP_RANGE,
    crowdingOut: CROWDING_OUT_RANGE,
    ...overrides,
  };
};

/** No Tough Hide and no buffs: the calculator's default damage mods. */
export const NO_MODS = DEFAULT_PLAYBOOK_DAMAGE_MODS;

export const modsWith = (
  overrides: Partial<PlaybookDamageMods>,
): PlaybookDamageMods => {
  return { ...NO_MODS, ...overrides };
};

/** A plan from its wrap picks; without `plays`, no slot picks a character play. */
export const planOf = (
  rows: WrapPick[][],
  plays?: CharacterPlayPickSlot[][],
): AttackPlan => {
  const noPlays = rows.map((row) => row.map(() => null));

  return { wrapPicks: rows, characterPlayPicks: plays ?? noPlays };
};

/** Three swings that each pick the same line once. */
export const threeOf = (id: string): AttackPlan => {
  return planOf([[id], [id], [id]]);
};

/** Enemy ARM in the neutral roll params: nothing to strip. */
const NEUTRAL_ARMOR = 0;

/** Swings in the neutral roll params. */
const NEUTRAL_BASE_COUNT = 2;

/**
 * Roll params with nothing in play: no charge, cover, stance, mods, Bonus Time
 * or TAC modifier, ARM 0 and the default DEF. Tests override what they exercise.
 */
export const makeRollParams = (
  overrides: Partial<ActivationRollParams> = {},
): ActivationRollParams => {
  return {
    attacker: makeAttacker(),
    chargeAttackIndex: NO_ATTACK_INDEX,
    armor: NEUTRAL_ARMOR,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    damageMods: NO_MODS,
    enemyDef: DEF_DEFAULT,
    bonusTimeByAttack: [],
    initialTacModifier: 0,
    activeBaseCount: NEUTRAL_BASE_COUNT,
    ...overrides,
  };
};
