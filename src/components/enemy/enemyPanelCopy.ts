import {
  COVER_TAC_PENALTY,
  DEFENSIVE_STANCE_DEF_BONUS,
  KNOCKED_DOWN_DEF_PENALTY,
  SNARED_DEF_PENALTY,
  TOUGH_HIDE_DAMAGE_PENALTY,
} from '@/core/shared/constants';

export const LABEL_KNOCKED_DOWN = `Knocked Down (-${KNOCKED_DOWN_DEF_PENALTY} DEF)`;

export const LABEL_SNARED = `Snared (-${SNARED_DEF_PENALTY} DEF)`;

export const TOOLTIP_COVER = `Terrain: attacks that still count as in cover take -${COVER_TAC_PENALTY} TAC. An earlier > or >> in this activation can clear cover for later swings.`;

export const TOOLTIP_DEFENSIVE_STANCE = `On the charge attack only, the model counts as +${DEFENSIVE_STANCE_DEF_BONUS} DEF on its hit roll (still capped at the normal DEF maximum).`;

export const TOOLTIP_TOUGH_HIDE = `-${TOUGH_HIDE_DAMAGE_PENALTY} to damage on each selected playbook line that has card damage (can reduce a pip to 0).`;

export const TOOLTIP_KNOCKED_DOWN = `Target starts the activation Knocked Down: -${KNOCKED_DOWN_DEF_PENALTY} DEF. Only one KD can apply, so the playbook KD is disabled.`;

export const TOOLTIP_SNARED = `Target starts the activation Snared: -${SNARED_DEF_PENALTY} DEF.`;

export const TOOLTIP_BURNING =
  'Target starts the activation Burning. Matters to attackers with Burning Passion.';

export const TOOLTIP_RESILIENCE =
  'Resilience: the activation’s first attack is wholly ignored (no damage, effects, wraps, momentum, or Berserker trigger) and carries nothing over to later attacks. That swing is shown but disabled.';

export const LABEL_GUILD_DEBUFFS = 'Guild debuffs';
