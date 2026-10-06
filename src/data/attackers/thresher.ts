import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { theyAintTough } from '@/data/characterPlays';
import { dontFearTheReaper } from '@/data/characterTraits';
import { farmers } from '@/data/guilds/farmers';

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
];

export const thresher: AttackerData = {
  id: 'thresher',
  name: 'Thresher',
  tac: 7,
  inf: 5,
  furious: false,
  berserker: false,
  feral: false,
  playbook: PLAYBOOK,
  guild: farmers,
  characterPlays: [theyAintTough],
  // He is the guild's source of They Ain't Tough!, and Our Tools Are Sharp and
  // Lend a Hand come from Festival, the other Farmers captain, who cannot share
  // a team with him. So none of them can be pre-applied to him.
  excludedGuildBuffs: ['theyAintTough', 'ourToolsAreSharp', 'lendAHand'],
  characterTraits: [dontFearTheReaper],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
