import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

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
] as const;

/**
 * Veteran Boar. Furious + Berserker, INF cap 2: with all 2 influence on attacks
 * and a (free) charge that is 3 base attacks, each able to spawn a Berserker —
 * the 3-base / 6-max layout the calculator originally hardcoded.
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
  buffs: [
    {
      id: 'tooledUp',
      label: 'Tooled Up',
      tooltip: '+1 damage on each selected playbook line damage result.',
      damageBonus: 1,
    },
    {
      id: 'theOwner',
      label: 'The Owner',
      tooltip: '+1 damage on each selected playbook line damage result.',
      damageBonus: 1,
    },
  ],
  startingMomentum: { min: 0, max: 20 },
  initialTacModifier: { min: -5, max: 5 },
};
