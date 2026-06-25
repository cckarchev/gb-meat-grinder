import { describe, it, expect } from 'vitest';
import {
  attackerHasSearingStrike,
  buffsTacBonusSum,
  damageIfAllHitsWrap,
  effectiveArmor,
  enemyBurning,
  enemyHasStaticSearingStrike,
  getPlaybookResult,
  momentousLineStyle,
  pickGeneratesMomentum,
  specialAbilityFlatDamage,
} from '@/core/playbook';
import { computeAttackSequence, modifiersBeforeAttack } from '@/core/attackSequence';
import { cast } from '@/attackers/cast';
import { veteranCinder } from '@/attackers/veteranCinder';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

// ---------------------------------------------------------------------------
// Readable wrappers around the engine. The raw functions take many positional
// arguments; these name the inputs so each test reads as a plain statement.
// ---------------------------------------------------------------------------

// Cast and Veteran Cinder both run 3 active swings (TAC ≥5, INF cap 4, no
// Berserker), planned over 4 rows with the last empty.
const ACTIVE = 3;
const noCp: CharacterPlayPickSlot[][] = [[null], [null], [null], []];
const noBonusTime = [false, false, false, false];

/** The enemy-condition / buff bag, built plainly: `conditions({ toughHide: true })`. */
const conditions = (
  over: Partial<PlaybookDamageMods> = {},
): PlaybookDamageMods => ({ toughHide: false, buffs: {}, ...over });

/** `n` swings of the same playbook result, padded out to the 4-row plan. */
const swings = (id: string, n = ACTIVE): WrapPick[][] =>
  [0, 1, 2, 3].map((i) => (i < n ? [id] : []));

/** Damage on each swing, assuming every hit lands. */
function damagePerSwing(
  attacker: AttackerData,
  picks: WrapPick[][],
  m: PlaybookDamageMods,
  opts: {
    cps?: CharacterPlayPickSlot[][];
    activeBaseCount?: number;
    chargeFlatDamageIndex?: number;
  } = {},
): number[] {
  const { cps = noCp, activeBaseCount = ACTIVE, chargeFlatDamageIndex = -1 } =
    opts;
  return damageIfAllHitsWrap(
    attacker,
    picks,
    cps,
    m,
    activeBaseCount,
    chargeFlatDamageIndex,
  );
}

/** Per-swing attack context (TAC / ARM / …), guild −ARM folded into ARM first. */
function attackSequence(
  attacker: AttackerData,
  printedArmor: number,
  m: PlaybookDamageMods,
  picks: WrapPick[][],
  opts: {
    initialTacModifier?: number;
    chargeAttackIndex?: number;
    chargeFlatDamageIndex?: number;
  } = {},
) {
  const { initialTacModifier = 0, chargeAttackIndex = -1, chargeFlatDamageIndex =
    -1 } = opts;
  return computeAttackSequence(
    attacker,
    4, // enemy base DEF — irrelevant to the ARM/TAC carry-over checked here
    effectiveArmor(attacker, printedArmor, m),
    picks,
    noCp,
    chargeAttackIndex,
    false, // no cover
    false, // no defensive stance
    m,
    noBonusTime,
    initialTacModifier,
    ACTIVE,
    chargeFlatDamageIndex,
  ).attacks;
}

/** Enemy ARM facing each swing. */
const armorPerSwing = (
  attacker: AttackerData,
  printedArmor: number,
  m: PlaybookDamageMods,
  picks: WrapPick[][],
  opts: Parameters<typeof attackSequence>[4] = {},
): number[] => attackSequence(attacker, printedArmor, m, picks, opts).map((a) => a.armor);

/** −DEF carried into `swingIndex` from character plays on earlier picks. */
const defReductionInto = (
  attacker: AttackerData,
  picks: WrapPick[][],
  cps: CharacterPlayPickSlot[][],
  swingIndex: number,
): number =>
  modifiersBeforeAttack(attacker, picks, cps, swingIndex, conditions(), ACTIVE)
    .defReduction;

// ---------------------------------------------------------------------------

describe('Tempered Steel & Searing Strike sources', () => {
  it('Tempered Steel grants +1 TAC and Searing Strike', () => {
    const ts = conditions({ buffs: { temperedSteel: true } });
    expect(buffsTacBonusSum(cast, ts)).toBe(1);
    expect(attackerHasSearingStrike(cast, ts)).toBe(true);
  });
  it('Cast has no Searing Strike without Tempered Steel', () => {
    expect(attackerHasSearingStrike(cast, conditions())).toBe(false);
  });
  it('Veteran Cinder has intrinsic Searing Strike', () => {
    expect(attackerHasSearingStrike(veteranCinder, conditions())).toBe(true);
  });
});

describe('Enemy conditions are independent toggles', () => {
  it('Searing Strike debuff is −1 ARM only, not Burning', () => {
    const ss = conditions({ buffs: { searingStrike: true } });
    expect(enemyHasStaticSearingStrike(cast, ss)).toBe(true);
    expect(enemyBurning(cast, ss)).toBe(false);
  });
  it('Burning is its own toggle', () => {
    expect(enemyBurning(cast, conditions({ buffs: { burning: true } }))).toBe(
      true,
    );
  });
});

describe('Searing Strike −1 ARM carry-over', () => {
  it('first swing is full ARM, later swings −1 (vCinder intrinsic)', () => {
    expect(armorPerSwing(veteranCinder, 2, conditions(), swings('dmg1'))).toEqual(
      [2, 1, 1],
    );
  });

  it('Sweeping Charge triggers it for later swings, not the charge attack', () => {
    // Charge swing (index 0) deals no card damage (tackle), but Sweeping
    // Charge's flat 3 lands alongside it: the charge attack is still full ARM,
    // and every later swing is −1.
    const chargePicks: WrapPick[][] = [['tackle'], ['dmg1'], ['dmg1'], []];
    expect(
      armorPerSwing(veteranCinder, 2, conditions(), chargePicks, {
        chargeAttackIndex: 0,
        chargeFlatDamageIndex: 0,
      }),
    ).toEqual([2, 1, 1]);
    // Without that flat damage the 0-damage charge swing would not trigger it,
    // so −1 only comes online after the first swing that does deal damage.
    expect(
      armorPerSwing(veteranCinder, 2, conditions(), chargePicks, {
        chargeAttackIndex: 0,
        chargeFlatDamageIndex: -1,
      }),
    ).toEqual([2, 2, 1]);
  });

  it('Cast in Tempered Steel: +1 TAC, and the same −1 ARM from swing 2', () => {
    const ts = conditions({ buffs: { temperedSteel: true } });
    const seq = attackSequence(cast, 2, ts, swings('dmg1'), {
      initialTacModifier: buffsTacBonusSum(cast, ts),
    });
    expect(seq[0].tac).toBe(6);
    expect(seq.map((a) => a.armor)).toEqual([2, 1, 1]);
  });

  it('pre-applied Searing Strike is −1 from swing 1; Weak Point stacks (−2)', () => {
    // Static Searing Strike → −1 present from the first swing (no double with
    // intrinsic); Weak Point is a different source so it stacks: base 3 → 1.
    expect(
      armorPerSwing(
        veteranCinder,
        3,
        conditions({ buffs: { searingStrike: true } }),
        swings('dmg1'),
      ),
    ).toEqual([2, 2, 2]);
    expect(
      armorPerSwing(
        veteranCinder,
        3,
        conditions({ buffs: { searingStrike: true, weakPoint: true } }),
        swings('dmg1'),
      ),
    ).toEqual([1, 1, 1]);
  });

  it('Weak Point alone reduces effectiveArmor by 1', () => {
    expect(effectiveArmor(cast, 3, conditions({ buffs: { weakPoint: true } }))).toBe(2);
    // Searing Strike is routed per-swing, not folded into effectiveArmor.
    expect(
      effectiveArmor(cast, 3, conditions({ buffs: { searingStrike: true } })),
    ).toBe(3);
  });
});

describe('Burning Passion (Cast) off-by-one', () => {
  it('first damaging swing unbuffed, later swings +1', () => {
    expect(
      damagePerSwing(
        cast,
        swings('dmg1'),
        conditions({ buffs: { temperedSteel: true } }),
      ),
    ).toEqual([1, 2, 2, 0]);
  });
  it('pre-applied Burning buffs every swing', () => {
    expect(
      damagePerSwing(
        cast,
        swings('dmg1'),
        conditions({ buffs: { temperedSteel: true, burning: true } }),
      ),
    ).toEqual([2, 2, 2, 0]);
  });
  it('no Burning Passion without Searing Strike or Burning', () => {
    expect(damagePerSwing(cast, swings('dmg1'), conditions())).toEqual([
      1, 1, 1, 0,
    ]);
  });
});

describe('Tooled Up stacks with Burning Passion (Cast), only while Burning', () => {
  // Cast's net-2 result (`two_gb`) is 2 card damage. Tooled Up always adds +1;
  // Burning Passion adds another +1, but only when the target was Burning
  // beforehand — so the two reach +2 (→ 4) only while Burning.
  const damageOf = (m: PlaybookDamageMods): number =>
    damagePerSwing(cast, [['two_gb'], [], [], []], m, { activeBaseCount: 1 })[0];

  it('Burning + Tooled Up: her 2nd-column GB hits for 4 (2 +1 +1)', () => {
    expect(damageOf(conditions({ buffs: { burning: true, tooledUp: true } }))).toBe(
      4,
    );
  });
  it('Tooled Up alone (not Burning): Burning Passion is inert, so 2 → 3', () => {
    expect(damageOf(conditions({ buffs: { tooledUp: true } }))).toBe(3);
  });
});

describe('Shield Glare (Cast) is a single, non-stacking −1 DEF debuff', () => {
  // Cast's GB results (net-2 `two_gb`, net-5 `five_gb`) both pick a character
  // play; her only play is Shield Glare. Its −1 DEF is one debuff source, so
  // triggering it twice still caps at −1 — it must not stack.
  it('one trigger reduces a later swing by 1 DEF', () => {
    const picks: WrapPick[][] = [['two_gb'], ['dmg1'], ['dmg1'], []];
    const cps: CharacterPlayPickSlot[][] = [['shieldGlare'], [null], [null], []];
    expect(defReductionInto(cast, picks, cps, 1)).toBe(1);
  });
  it('two triggers do not stack: still −1 DEF on a later swing', () => {
    const picks: WrapPick[][] = [['two_gb'], ['five_gb'], ['dmg1'], []];
    const cps: CharacterPlayPickSlot[][] = [
      ['shieldGlare'],
      ['shieldGlare'],
      [null],
      [],
    ];
    expect(defReductionInto(cast, picks, cps, 2)).toBe(1);
  });
});

describe('Impale (Veteran Cinder): a character play that deals damage', () => {
  // Impale lands on her net-3 `gb` row (0 card damage); the default play there
  // is Impale itself.
  const impaleDamage = (m: PlaybookDamageMods): number =>
    damagePerSwing(veteranCinder, [['gb'], [], [], []], m, {
      activeBaseCount: 1,
    })[0];

  it('deals 3 on the GB row with no modifiers', () => {
    expect(impaleDamage(conditions())).toBe(3);
  });
  it('is once per turn: a second GB lands nothing', () => {
    expect(
      damagePerSwing(veteranCinder, [['gb'], ['gb'], [], []], conditions(), {
        activeBaseCount: 2,
      }),
    ).toEqual([3, 0, 0, 0]);
  });
  it('Tough Hide reduces it like a playbook line: 3 → 2', () => {
    expect(impaleDamage(conditions({ toughHide: true }))).toBe(2);
  });
  it('Tooled Up lifts it like a playbook line: 3 → 4', () => {
    expect(impaleDamage(conditions({ buffs: { tooledUp: true } }))).toBe(4);
  });
  it('Tough Hide + Tooled Up cancel: back to 3', () => {
    expect(
      impaleDamage(conditions({ toughHide: true, buffs: { tooledUp: true } })),
    ).toBe(3);
  });
});

describe('Sweeping Charge: flat damage from a special ability, fully unmodified', () => {
  it('auto +3 on a charge with no toggle, 0 otherwise', () => {
    expect(specialAbilityFlatDamage(veteranCinder, {}, true)).toBe(3);
    expect(specialAbilityFlatDamage(veteranCinder, {}, false)).toBe(0);
  });
  it('takes no damage mods, so Tough Hide / Tooled Up can never touch it', () => {
    // It is unmodified by construction — the function has no PlaybookDamageMods
    // parameter — so a charge always contributes exactly its printed 3.
    expect(specialAbilityFlatDamage(veteranCinder, {}, true)).toBe(3);
  });
});

describe('Momentum is per-result, not damage-gated', () => {
  it('a 0-damage momentous GB still generates momentum and renders momentous', () => {
    expect(pickGeneratesMomentum(veteranCinder, 'gb')).toBe(true);
    expect(momentousLineStyle(veteranCinder, 'gb', conditions())).toBe('heat');
  });
  it('non-momentous lines do not', () => {
    expect(pickGeneratesMomentum(veteranCinder, 'tackle')).toBe(false);
    expect(momentousLineStyle(veteranCinder, 'tackle', conditions())).toBe(
      'none',
    );
    expect(pickGeneratesMomentum(cast, 'dmg1')).toBe(false);
  });
  it('a momentous damage line zeroed by Tough Hide still flags zeroed', () => {
    expect(
      momentousLineStyle(veteranCinder, 'dmg1', conditions({ toughHide: true })),
    ).toBe('zeroed');
  });
});

describe('>< pushes, so it clears cover', () => {
  it('Cast’s >< and net-5 GB clear cover', () => {
    expect(getPlaybookResult(cast, 'push_dodge').clearsCover).toBe(true);
    expect(getPlaybookResult(cast, 'five_gb').clearsCover).toBe(true);
  });
});
