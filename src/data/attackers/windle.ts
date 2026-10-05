import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { snackBreak } from '@/data/characterPlays';
import { farmers } from '@/data/guilds/farmers';

/**
 * Windle playbook. All damage results are momentous. The momentous-2 on column
 * 3 also has a GB triggering Snack Break (recover HP). It still deals its 2
 * damage, and the character play has no effect on the attack math, so it shows
 * as a 2 plus a (no-op) character-play menu.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'push',
        label: '>',
        damage: 0,
        clearsCover: true,
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
        id: 'kd',
        label: 'KD',
        defReductionForLater: 1,
        damage: 0,
        appliesKnockDown: true,
      },
      {
        id: 'm3',
        label: '3',
        damage: 3,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'push_push',
        label: '>>',
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'm2_gb',
        label: '2',
        damage: 2,
        momentum: true,
        picksCharacterPlay: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'm4',
        label: '4',
        damage: 4,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'm5',
        label: '5',
        damage: 5,
        momentum: true,
      },
    ],
  },
];

export const windle: AttackerData = {
  id: 'windle',
  name: 'Windle',
  tac: 6,
  inf: 2,
  furious: false,
  berserker: true,
  feral: false,
  playbook: PLAYBOOK,
  guild: farmers,
  characterPlays: [snackBreak],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
