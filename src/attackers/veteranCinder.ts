import { impale } from '@/characterPlays';
import { blacksmiths } from '@/guilds/blacksmiths';
import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * Veteran Cinder playbook (dodge-heavy). Momentous damage on net 1 / 3 / 5 / 7;
 * net 3 also offers a momentous GB that triggers Impale (3 unmodified damage) in
 * place of the 2. `T` (tackle), `<` (dodge) and `<<` (double dodge) do nothing
 * for the attack math.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'dmg1',
        label: '1',
        damage: 1,
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
      {
        id: 'dodge',
        label: '<',
        damage: 0,
      },
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
      {
        id: 'dmg2',
        label: '2',
        damage: 2,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'dodge_4',
        label: '<<',
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'dmg4',
        label: '4',
        damage: 4,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'dodge_6',
        label: '<<',
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 7,
    results: [
      {
        id: 'dmg6',
        label: '6',
        damage: 6,
        momentum: true,
      },
    ],
  },
] as const;

/**
 * Veteran Cinder (Blacksmiths attacking midfielder). TAC 6, INF cap 4, no
 * Furious/Berserker/Feral. Searing Strike is intrinsic: any damage she deals
 * leaves the target −1 ARM and Burning for the rest of the activation. Sweeping
 * Charge deals 3 unmodified damage alongside the charge attack — so that first
 * attack is still at full ARM, but it triggers Searing Strike for every later
 * swing; her GB result triggers Impale for 3 more (once per turn), which likewise
 * triggers it from a 0-card-damage swing onward.
 */
export const veteranCinder: AttackerData = {
  id: 'veteran-cinder',
  name: 'Veteran Cinder',
  tac: 6,
  inf: 4,
  playbook: PLAYBOOK,
  guild: blacksmiths,
  characterPlays: [impale],
  searingStrike: true,
  specialAbilities: [
    {
      id: 'sweepingCharge',
      label: 'Sweeping Charge',
      tooltip:
        'Always active: on a charge, models in her melee zone suffer 3 unmodified damage (ignores ARM / Tough Hide). It lands alongside the charge attack, so that first attack is still at full ARM — but it counts as damage, triggering Searing Strike (−1 ARM + Burning) for every later swing.',
      flatDamage: 3,
      requiresCharge: true,
      alwaysActive: true,
    },
  ],
  startingMomentum: { min: 0, max: 20 },
  gangingUp: { min: 0, max: 5 },
  crowdingOut: { min: 0, max: 5 },
};
