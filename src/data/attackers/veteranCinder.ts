import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { impale } from '@/data/characterPlays';
import { searingStrike, sweepingCharge } from '@/data/characterTraits';
import { blacksmiths } from '@/data/guilds/blacksmiths';

/**
 * Veteran Cinder playbook, from the card: `1;M`, `T`/`<`, `CP;M`/`2;M`, `<<`,
 * `4;M`, `<<;M`, `6;M`. The net-6 double dodge is momentous.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [{ id: 'dmg1', label: '1', damage: 1, momentum: true }],
  },
  {
    netSuccesses: 2,
    results: [
      { id: 'tackle', label: 'T', damage: 0 },
      { id: 'dodge', label: '<', damage: 0 },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'gb',
        label: 'GB',
        damage: 0,
        momentum: true,
        picksCharacterPlay: true,
      },
      { id: 'dmg2', label: '2', damage: 2, momentum: true },
    ],
  },
  {
    netSuccesses: 4,
    results: [{ id: 'double_dodge', label: '<<', damage: 0 }],
  },
  {
    netSuccesses: 5,
    results: [{ id: 'dmg4', label: '4', damage: 4, momentum: true }],
  },
  {
    netSuccesses: 6,
    results: [{ id: 'double_dodge_m', label: '<<', damage: 0, momentum: true }],
  },
  {
    netSuccesses: 7,
    results: [{ id: 'dmg6', label: '6', damage: 6, momentum: true }],
  },
];

export const veteranCinder: AttackerData = {
  id: 'veteran-cinder',
  name: 'Veteran Cinder',
  tac: 6,
  inf: 4,
  furious: false,
  berserker: false,
  feral: false,
  playbook: PLAYBOOK,
  guild: blacksmiths,
  characterPlays: [impale],
  characterTraits: [searingStrike, sweepingCharge],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
