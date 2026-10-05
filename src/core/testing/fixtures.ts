import { DEFAULT_PLAYBOOK_DAMAGE_MODS } from '@/core/damage/damage';
import type {
  CharacterPlay,
  PlaybookColumn,
  PlaybookDamageMods,
  PlaybookResult,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
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
    tacBonusForLater: 0,
    defReductionForLater: 0,
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

export const PLAY_TAC: CharacterPlay = {
  id: 'playTac',
  label: 'Play TAC',
  tacBonusForLater: 2,
};

export const PLAY_DEF: CharacterPlay = {
  id: 'playDef',
  label: 'Play DEF',
  defReductionForLater: 1,
};

export const PLAY_ARM: CharacterPlay = {
  id: 'playArm',
  label: 'Play ARM',
  armorReduction: 1,
};

export const PLAY_REPEATABLE: CharacterPlay = {
  id: 'playRepeatable',
  label: 'Play Repeatable',
  tacBonusForLater: 1,
  repeatable: true,
};

export const PLAY_NOOP: CharacterPlay = {
  id: 'playNoop',
  label: 'Play Noop',
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
    startingMomentum: { min: 0, max: 20 },
    gangingUp: { min: 0, max: 5 },
    crowdingOut: { min: 0, max: 5 },
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
