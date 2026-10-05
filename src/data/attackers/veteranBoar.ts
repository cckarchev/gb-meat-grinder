import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { singledOut, stagger } from '@/data/characterPlays';
import { butchers } from '@/data/guilds/butchers';

/**
 * Veteran Boar playbook: columns in card order. Each column needs `netSuccesses`
 * after ARM; `results` has 1–2 lines (a `|` on the card = two entries here).
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'push',
        label: '>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'dmg1',
        label: '1',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 1,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'gb',
        label: 'GB',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        picksCharacterPlay: true,
      },
      {
        id: 'dmg2',
        label: '2',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 2,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'kd',
        label: 'KD',
        tacBonusForLater: 0,
        defReductionForLater: 1,
        damage: 0,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'push_push',
        label: '>>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'dmg3',
        label: '3',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 3,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'one_gb',
        label: '1GB',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 1,
        picksCharacterPlay: true,
      },
      {
        id: 'tackle',
        label: 'T',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'dmg5',
        label: '5',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 5,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 7,
    results: [
      {
        id: 'dmg6',
        label: '6',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 6,
        momentum: true,
      },
    ],
  },
];

/**
 * Veteran Boar. Furious + Berserker, INF cap 2: with all 2 influence on attacks
 * and a (free) charge that is 3 base attacks, each able to spawn a Berserker.
 */
export const veteranBoar: AttackerData = {
  id: 'veteran-boar',
  name: 'Veteran Boar',
  tac: 8,
  inf: 2,
  furious: true,
  berserker: true,
  feral: false,
  playbook: PLAYBOOK,
  guild: butchers,
  characterPlays: [singledOut, stagger],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
