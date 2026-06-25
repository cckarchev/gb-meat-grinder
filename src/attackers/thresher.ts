import { theyAintTough } from '@/characterPlays';
import { farmers } from '@/guilds/farmers';
import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * Thresher playbook. `<` (dodge) and `T` (tackle) do nothing for attacking but
 * are mapped as selectable results. The net-3 GB applies They Ain't Tough!
 * (−1 enemy ARM) to later swings.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'dodge',
        label: '<',
        damage: 0,
      },
      {
        id: 'm2',
        label: '2',
        damage: 2,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'tackle',
        label: 'T',
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'three_gb',
        label: '3GB',
        damage: 3,
        picksCharacterPlay: true,
      },
      {
        id: 'kd_dodge',
        label: 'KD',
        defReductionForLater: 1,
        damage: 0,
        appliesKnockDown: true,
        dodge: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'm3_dodge',
        label: '3',
        damage: 3,
        momentum: true,
        dodge: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'm3_kd',
        label: '3KD',
        defReductionForLater: 1,
        damage: 3,
        momentum: true,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'm4',
        label: '4',
        damage: 4,
        momentum: true,
      },
    ],
  },
] as const;

export const thresher: AttackerData = {
  id: 'thresher',
  name: 'Thresher',
  tac: 7,
  inf: 5,
  playbook: PLAYBOOK,
  guild: farmers,
  characterPlays: [theyAintTough],
  // He is the guild's source of They Ain't Tough!; another captain grants Our
  // Tools Are Sharp. So neither can be pre-applied to him.
  excludedGuildBuffs: ['theyAintTough', 'ourToolsAreSharp'],
  specialAbilities: [
    {
      id: 'dontFearTheReaper',
      label: "Don't Fear The Reaper",
      tooltip:
        'Remove a Harvest marker to deal 3 unmodified damage (ignores ARM, ' +
        'Tough Hide and buffs).',
      flatDamage: 3,
    },
  ],
  startingMomentum: { min: 0, max: 20 },
  gangingUp: { min: 0, max: 5 },
  crowdingOut: { min: 0, max: 5 },
};
