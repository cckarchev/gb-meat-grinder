import { describe, it, expect } from 'vitest';
import { damageIfAllHitsWrap } from '@/core/playbook';
import type { AttackerData } from '@/types/core/attacker';
import type { Guild } from '@/types/core/guild';
import type {
  CharacterPlay,
  CharacterPlayPickSlot,
  PlaybookColumn,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

/**
 * Generic, model-agnostic damage scenarios: a synthetic attacker with a clean
 * 1- / 2-damage playbook lands every swing, and we assert the *total* damage as
 * a final-HP number. These guard the core engine math (Tough Hide, Burning,
 * Burning Passion, Searing Strike, external buffs and their interactions)
 * against regressions, independent of any one real model's stats. The number
 * computed is "damage if every swing hits" — ARM gates whether a swing lands,
 * not the size of the card result, so it does not enter here.
 */

// A throwaway guild exposing just the enemy/attacker conditions toggled below:
// Burning (enables Burning Passion) and an external +1 damage buff (e.g. Tooled
// Up). Tough Hide is a direct mod flag and Searing Strike is set intrinsically
// on the model, so neither needs a guild buff.
const testGuild: Guild = {
  id: 'test',
  name: 'Test',
  color: '#000000',
  buffs: [
    {
      id: 'burning',
      label: 'Burning',
      tooltip: '',
      target: 'enemy',
      appliesBurning: true,
    },
    { id: 'tooledUp', label: 'Tooled Up', tooltip: '', damageBonus: 1 },
  ],
};

// A character play that deals flat damage (Impale-like), for the "character-play
// damage" section. It is the default play on the `gbPlay` result below.
const jab: CharacterPlay = {
  id: 'jab',
  label: 'Jab',
  flatDamage: 3,
  oncePerTurn: true,
};

// 1- and 2-damage lines, plus a damageless GB row that triggers the `jab` play.
const PLAYBOOK: readonly PlaybookColumn[] = [
  { netSuccesses: 1, results: [{ id: 'hit1', label: '1', damage: 1 }] },
  { netSuccesses: 2, results: [{ id: 'hit2', label: '2', damage: 2 }] },
  {
    netSuccesses: 3,
    results: [{ id: 'gbPlay', label: 'GB', damage: 0, picksCharacterPlay: true }],
  },
];

/** A vanilla TAC-5 attacker, optionally with Burning Passion / Searing Strike. */
function dummy(
  opts: { burningPassion?: boolean; searingStrike?: boolean } = {},
): AttackerData {
  return {
    id: 'dummy',
    name: 'Dummy',
    tac: 5,
    inf: 4,
    playbook: PLAYBOOK,
    guild: testGuild,
    characterPlays: [jab],
    burningPassion: opts.burningPassion,
    searingStrike: opts.searingStrike,
    startingMomentum: { min: 0, max: 20 },
    gangingUp: { min: 0, max: 5 },
    crowdingOut: { min: 0, max: 5 },
  };
}

// Three landing swings of the same line; the 4th plan row is inactive.
const threeOf = (id: string): WrapPick[][] => [[id], [id], [id], []];
const noCp: CharacterPlayPickSlot[][] = [[null], [null], [null], []];

const conditions = (
  over: Partial<PlaybookDamageMods> = {},
): PlaybookDamageMods => ({ toughHide: false, buffs: {}, ...over });

/** Final HP after a full activation of three landing swings of `lineId`. */
function hpAfter(
  startHp: number,
  attacker: AttackerData,
  m: PlaybookDamageMods,
  lineId = 'hit2',
): number {
  const perSwing = damageIfAllHitsWrap(attacker, threeOf(lineId), noCp, m, 3, -1);
  return startHp - perSwing.reduce((a, b) => a + b, 0);
}

describe('Damage scenarios: 20 HP, three landing swings of 2', () => {
  it('vanilla — 3×2 = 6 → 14', () => {
    expect(hpAfter(20, dummy(), conditions())).toBe(14);
  });

  it('Tough Hide shaves 1 off each swing — 3×1 = 3 → 17', () => {
    expect(hpAfter(20, dummy(), conditions({ toughHide: true }))).toBe(17);
  });

  it('Burning alone is inert without Burning Passion → 14', () => {
    expect(hpAfter(20, dummy(), conditions({ buffs: { burning: true } }))).toBe(
      14,
    );
  });

  it('Burning + Burning Passion — +1 every swing, 3×3 = 9 → 11', () => {
    expect(
      hpAfter(
        20,
        dummy({ burningPassion: true }),
        conditions({ buffs: { burning: true } }),
      ),
    ).toBe(11);
  });

  it('Burning Passion + Searing Strike, not pre-burning — 2, then 3, 3 → 12', () => {
    // Searing Strike lights Burning only *after* the first damaging hit, so the
    // first swing is unbuffed (2) and the later two get +1 (3 each).
    expect(
      hpAfter(20, dummy({ burningPassion: true, searingStrike: true }), conditions()),
    ).toBe(12);
  });
});

describe('Damage scenarios: isolating and combining modifiers', () => {
  it('Burning Passion with no Burning source is inert → 14', () => {
    expect(hpAfter(20, dummy({ burningPassion: true }), conditions())).toBe(14);
  });

  it('Searing Strike without Burning Passion adds no damage → 14', () => {
    // Searing Strike is a −1 ARM / Burning condition; on its own it changes no
    // damage pip (the −1 ARM only matters to whether swings land, not here).
    expect(hpAfter(20, dummy({ searingStrike: true }), conditions())).toBe(14);
  });

  it('Burning + Burning Passion + Tough Hide — +1 and −1 cancel → 14', () => {
    expect(
      hpAfter(
        20,
        dummy({ burningPassion: true }),
        conditions({ toughHide: true, buffs: { burning: true } }),
      ),
    ).toBe(14);
  });

  it('External +1 damage buff (Tooled Up) — 3×3 = 9 → 11', () => {
    expect(
      hpAfter(20, dummy(), conditions({ buffs: { tooledUp: true } })),
    ).toBe(11);
  });

  it('Tooled Up + Burning Passion stack while Burning — 2+1+1 = 4 each, 3×4 → 8', () => {
    expect(
      hpAfter(
        20,
        dummy({ burningPassion: true }),
        conditions({ buffs: { tooledUp: true, burning: true } }),
      ),
    ).toBe(8);
  });

  it('Tooled Up + Burning Passion without Burning — only Tooled Up, 3×3 → 11', () => {
    expect(
      hpAfter(
        20,
        dummy({ burningPassion: true }),
        conditions({ buffs: { tooledUp: true } }),
      ),
    ).toBe(11);
  });

  it('Tooled Up + Tough Hide cancel out each swing — +1 and −1 → 14', () => {
    expect(
      hpAfter(
        20,
        dummy(),
        conditions({ toughHide: true, buffs: { tooledUp: true } }),
      ),
    ).toBe(14);
  });

  it('Tough Hide floors per-swing damage at 0 — 1-damage line → no damage', () => {
    expect(hpAfter(20, dummy(), conditions({ toughHide: true }), 'hit1')).toBe(
      20,
    );
  });
});

describe('Character-play damage (e.g. Impale) vs the three damage sources', () => {
  // A flat-3 play (`jab`) triggered off the damageless `gbPlay` row. Damage from
  // a play is modified like a playbook line — Tough Hide reduces it, Tooled Up
  // lifts it — EXCEPT Burning Passion, which only ever lifts playbook card
  // damage. (Special-ability flat damage like Sweeping Charge, covered in the
  // blacksmiths suite, is unmodified by all three.)
  const playDamage = (attacker: AttackerData, m: PlaybookDamageMods): number =>
    damageIfAllHitsWrap(
      attacker,
      [['gbPlay'], [], [], []],
      [['jab'], [], [], []],
      m,
      1,
      -1,
    )[0];

  it('deals its flat 3 with no modifiers', () => {
    expect(playDamage(dummy(), conditions())).toBe(3);
  });
  it('Tough Hide reduces it: 3 → 2', () => {
    expect(playDamage(dummy(), conditions({ toughHide: true }))).toBe(2);
  });
  it('Tooled Up lifts it: 3 → 4', () => {
    expect(playDamage(dummy(), conditions({ buffs: { tooledUp: true } }))).toBe(
      4,
    );
  });
  it('Burning Passion lifts a card swing but NOT the play (same conditions)', () => {
    const m = conditions({ buffs: { burning: true } });
    const attacker = dummy({ burningPassion: true });
    // A 2-damage card swing gets +1 → 3...
    expect(damageIfAllHitsWrap(attacker, [['hit2'], [], [], []], noCp, m, 1, -1)[0]).toBe(3);
    // ...but the flat-3 play is untouched by Burning Passion → stays 3.
    expect(playDamage(attacker, m)).toBe(3);
  });
});
