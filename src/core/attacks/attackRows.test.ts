import { describe, expect, it } from "vitest";
import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from "../activation/momentum";
import { characterPlayUsageBeforePick } from "../character-plays/characterPlayUsage";
import { rowDamageIfAllHit } from "../damage/rowDamage";
import { knockDownTakenBeforePick } from "../playbook/knockDown";
import { pickEffectsForLaterSwings } from "../playbook/rowEffects";
import { NO_ATTACK_INDEX } from "../shared/constants";
import {
  makeAttacker,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  orderFor,
} from "../testing/fixtures";
import { activationTimeline } from "./activationTimeline";
import {
  activationAttackIndices,
  attackRowIsActive,
  attackRowIsBerserker,
  basePicksDealDamage,
  berserkerSourceBaseIndex,
  picksBeforeInActivation,
} from "./attackRows";

const TOUGH_HIDE = modsWith({ toughHide: true });

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReductionForLater: 0,
  damageBonusForLater: 0,
};

describe("activation order", () => {
  const berserker = makeAttacker({ inf: 2, berserker: true });
  const wrapPicks = [["two"], ["dodge"], [null], [null]];

  it("puts each damaging base before its Berserker swing", () => {
    expect(activationAttackIndices(orderFor(berserker, 2), wrapPicks)).toEqual([
      0, 2, 1,
    ]);
  });

  it("activates rows by base count and Berserker damage", () => {
    const oneBase = orderFor(berserker, 1);
    const twoBases = orderFor(berserker, 2);
    const noBerserker = orderFor(makeAttacker(), 2);

    expect(attackRowIsActive(oneBase, wrapPicks, 1)).toBe(false);
    expect(attackRowIsActive(twoBases, wrapPicks, 2)).toBe(true);
    const berserkerRowOfInactiveBase = 3;

    expect(
      attackRowIsActive(twoBases, wrapPicks, berserkerRowOfInactiveBase),
    ).toBe(false);

    expect(attackRowIsActive(noBerserker, wrapPicks, 2)).toBe(false);
  });

  it("maps Berserker rows to their source base", () => {
    expect(attackRowIsBerserker(berserker, 2)).toBe(true);
    expect(attackRowIsBerserker(berserker, 1)).toBe(false);
    const secondBerserkerRow = 3;

    expect(berserkerSourceBaseIndex(berserker, secondBerserkerRow)).toBe(1);
  });

  it("knows whether base picks deal damage", () => {
    expect(basePicksDealDamage(berserker, ["dodge", "one"], NO_MODS)).toBe(
      true,
    );

    expect(basePicksDealDamage(berserker, ["one"], TOUGH_HIDE)).toBe(false);
  });

  it("projects damage per active row when every pick hits", () => {
    const timeline = activationTimeline(
      {
        wrapPicks,
        characterPlayPicks: wrapPicks.map((row) => row.map(() => null)),
      },
      {
        attacker: berserker,
        damageMods: NO_MODS,
        activeBaseCount: 2,
        chargeAttackIndex: NO_ATTACK_INDEX,
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
      },
    );

    expect(
      rowDamageIfAllHit(orderFor(berserker, 2), wrapPicks, timeline),
    ).toEqual([2, 0, 0, 0]);
  });
});

describe("rows outside the activation", () => {
  const attacker = makeAttacker();
  const wrapPicks = [["kd"], ["one"]];
  const plays = [[null], [null]];
  const inactiveRow = 1;
  const activeBaseCount = 1;

  it("fall back to neutral values", () => {
    const startingMomentum = 3;

    const momentumParams = {
      attacker,
      wrapPicks,
      damageMods: NO_MODS,
      startingMomentum,
      bonusTimeByAttack: [false, false],
      activeBaseCount,
    };

    expect(momentumPoolBeforeBonusTime(inactiveRow, momentumParams)).toBe(
      startingMomentum,
    );

    expect(momentumAfterAttackInclusive(inactiveRow, momentumParams)).toBe(
      startingMomentum,
    );

    const timeline = activationTimeline(
      { wrapPicks, characterPlayPicks: plays },
      {
        attacker,
        damageMods: NO_MODS,
        activeBaseCount,
        chargeAttackIndex: NO_ATTACK_INDEX,
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
      },
    );

    expect(timeline[inactiveRow].effectsBefore.armorReduction).toBe(0);

    const order = orderFor(attacker, activeBaseCount);
    const position = { attackIndex: inactiveRow, pickIndex: 0 };

    expect(
      characterPlayUsageBeforePick(
        order,
        { wrapPicks, characterPlayPicks: plays },
        position,
      ).size,
    ).toBe(0);

    expect(knockDownTakenBeforePick(order, wrapPicks, position, false)).toBe(
      false,
    );
  });

  it("give no effects for an empty pick", () => {
    expect(
      pickEffectsForLaterSwings(
        orderFor(attacker, 1),
        { wrapPicks: [[null]], characterPlayPicks: [[null]] },
        { attackIndex: 0, pickIndex: 0 },
        false,
      ),
    ).toEqual(NO_EFFECTS);
  });
});

describe("picksBeforeInActivation", () => {
  const berserker = makeAttacker({ inf: 2, berserker: true });
  const wrapPicks = [["two", null], ["one"], ["one"], [null]];

  const picksBefore = (attackIndex: number, pickIndex: number) =>
    picksBeforeInActivation(orderFor(berserker, 2), wrapPicks, {
      attackIndex,
      pickIndex,
    });

  it("walks earlier swings in activation order, Berserkers included", () => {
    expect(picksBefore(1, 0)).toEqual([
      { attackIndex: 0, pickIndex: 0, id: "two" },
      { attackIndex: 2, pickIndex: 0, id: "one" },
    ]);
  });

  it("stops before the given pick on its own swing", () => {
    expect(picksBefore(1, 1)).toEqual([
      { attackIndex: 0, pickIndex: 0, id: "two" },
      { attackIndex: 2, pickIndex: 0, id: "one" },
      { attackIndex: 1, pickIndex: 0, id: "one" },
    ]);
  });

  it("is empty for the first pick and for a swing outside the activation", () => {
    expect(picksBefore(0, 0)).toEqual([]);
    const rowOutsideActivation = 5;

    expect(picksBefore(rowOutsideActivation, 0)).toEqual([]);
  });
});
