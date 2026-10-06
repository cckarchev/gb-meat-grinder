import { describe, expect, it } from 'vitest';
import {
  assistNamedModels,
  characterPlayEffectSummary,
  characterPlayHasEffect,
  characterPlayPickEffects,
} from '@/core/characterPlays/characterPlayEffects';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import {
  makeAttacker,
  PLAY_ARM,
  PLAY_ASSIST,
  PLAY_DAMAGE,
  PLAY_DEF,
  PLAY_HALF_HEALTH,
  PLAY_NOOP,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReductionForLater: 0,
  damageBonusForLater: 0,
};

const ENGAGED = true;
const NOT_ENGAGED = false;

describe('character play effects', () => {
  it('grants Assist +1 TAC and +1 DMG to later attacks while a named model engages', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_ASSIST] });

    expect(characterPlayPickEffects(attacker, 'playAssist', ENGAGED)).toEqual({
      ...NO_EFFECTS,
      tacBonusForLater: 1,
      damageBonusForLater: 1,
    });
  });

  it('grants nothing from Assist when no named model engages', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_ASSIST] });

    expect(
      characterPlayPickEffects(attacker, 'playAssist', NOT_ENGAGED),
    ).toEqual(NO_EFFECTS);
  });

  it('describes Assist and counts it as an effect', () => {
    expect(characterPlayHasEffect(PLAY_ASSIST)).toBe(true);
    expect(characterPlayEffectSummary(PLAY_ASSIST)).toBe(
      'Assist [Mallet, Oak]: +1 TAC and +1 DMG to playbook damage results on ' +
        'later attacks while Mallet or Oak engages the target.',
    );
  });

  it('describes play damage and counts it as an effect', () => {
    expect(characterPlayHasEffect(PLAY_DAMAGE)).toBe(true);
    expect(characterPlayEffectSummary(PLAY_DAMAGE)).toBe(
      '3 DMG. Once per turn.',
    );
  });

  it('describes current-HP damage and counts it as an effect', () => {
    expect(characterPlayHasEffect(PLAY_HALF_HEALTH)).toBe(true);
    expect(characterPlayEffectSummary(PLAY_HALF_HEALTH)).toBe(
      "Condition DMG equal to 1/2 of the target's current HP, rounded down. " +
        'Once per turn.',
    );
  });

  it('describes play effects and cadence', () => {
    expect(characterPlayHasEffect(PLAY_NOOP)).toBe(false);
    expect(characterPlayHasEffect(PLAY_ARM)).toBe(true);

    expect(
      characterPlayPickEffects(
        makeAttacker({ characterPlays: [PLAY_ARM] }),
        'playArm',
        NOT_ENGAGED,
      ),
    ).toEqual({
      ...NO_EFFECTS,
      armorReductionForLater: 1,
    });

    expect(characterPlayEffectSummary(PLAY_TAC)).toBe(
      '+2 TAC on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(PLAY_REPEATABLE)).toBe(
      '+1 TAC on later attacks.',
    );

    expect(characterPlayEffectSummary(PLAY_NOOP)).toBe(
      'No effect on the attack math. Once per turn.',
    );
  });

  it('describes DEF, ARM and combined effects', () => {
    const combined: CharacterPlay = {
      id: 'combo',
      label: 'Combo',
      tacBonusForLater: 1,
      armorReduction: 1,
      oncePerTurn: true,
    };

    expect(characterPlayEffectSummary(PLAY_DEF)).toBe(
      '-1 enemy DEF on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(PLAY_ARM)).toBe(
      '-1 enemy ARM on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(combined)).toBe(
      '+1 TAC on later attacks; -1 enemy ARM on later attacks. Once per turn.',
    );
  });
});

describe('assistNamedModels', () => {
  it('lists the models named by the attacker Assist plays', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_TAC, PLAY_ASSIST] });

    expect(assistNamedModels(attacker)).toEqual(['Mallet', 'Oak']);
  });

  it('is empty for a model without Assist', () => {
    expect(assistNamedModels(makeAttacker())).toEqual([]);
  });
});
