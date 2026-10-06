import { CHARGE_INFLUENCE_COST } from '@/core/shared/constants';

export const TOOLTIP_CHARGE = `Charge this activation (costs ${CHARGE_INFLUENCE_COST} influence).`;

export const TOOLTIP_CHARGE_FURIOUS =
  'Charge this activation (free for Furious).';

export const LABEL_CHARGE_COST = ` (-${CHARGE_INFLUENCE_COST} influence)`;

export const LABEL_CHARGE_COST_FURIOUS = ' (free)';

export const LABEL_GUILD_BUFFS = 'Guild buffs';

export const LABEL_ACTIVATED_TRAITS = 'Activated traits';

export const LABEL_CHARGING = 'Charging';

/** An activated trait with the flat damage it adds, e.g. `Don't Fear The... (+2)`. */
export const labelActivatedTrait = (
  label: string,
  flatDamage: number,
): string => {
  return `${label} (+${flatDamage})`;
};
