/** Which ganging up values the scenario allows. */

import type { AttackerData, StatRange } from "@/data/attackers/attacker.types";
import { activeBuffs } from "../attackers/buffsAndTraits";
import type { PlaybookDamageMods } from "../playbook/playbook.types";
import { ASSIST_ENGAGED_GANGING_UP_MIN } from "../shared/constants";

/**
 * The attacker's ganging up range. A teammate an active effect needs engaging
 * the target gives ganging up itself, so the bonus cannot drop below its
 * minimum: a named Assist model (Mallet or Oak for Bucker) or the source of a
 * guild buff such as Lend a Hand (Festival).
 */
export const gangingUpRange = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): StatRange => {
  const range = attacker.gangingUp;
  const assistMin = mods.assistEngaged ? ASSIST_ENGAGED_GANGING_UP_MIN : 0;
  const buffMins = activeBuffs(attacker, mods).map(
    (buff) => buff.gangingUpMin ?? 0,
  );

  const min = Math.max(range.min, assistMin, ...buffMins);

  return { ...range, min };
};
