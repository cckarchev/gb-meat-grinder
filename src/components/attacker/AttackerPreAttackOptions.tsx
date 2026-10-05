import {
  LABEL_CHARGE_COST,
  LABEL_CHARGE_COST_FURIOUS,
  TOOLTIP_CHARGE,
  TOOLTIP_CHARGE_FURIOUS,
} from '@/components/attacker/attackerPanelCopy';
import { GuildBuffCheckbox } from '@/components/ui/GuildBuffCheckbox';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { guildBuffsFor } from '@/core/damage/damage';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Charging, guild buffs and activated traits toggled before the attack. */
export const AttackerPreAttackOptions = () => {
  const { attacker, charging, activeTraits, dispatch } =
    useMeatGrinderSimulation();

  const chargeTooltip = attacker.furious
    ? TOOLTIP_CHARGE_FURIOUS
    : TOOLTIP_CHARGE;

  const chargeCostLabel = attacker.furious
    ? LABEL_CHARGE_COST_FURIOUS
    : LABEL_CHARGE_COST;

  return (
    <>
      <TooltipCheckbox
        checked={charging}
        onChange={(value) => dispatch({ type: 'charging', value })}
        tooltip={chargeTooltip}
      >
        Charging{chargeCostLabel}
      </TooltipCheckbox>
      {guildBuffsFor(attacker, 'attacker').map((buff) => (
        <GuildBuffCheckbox key={buff.id} buff={buff} />
      ))}
      {(attacker.characterTraits ?? [])
        .filter((trait) => trait.active === true)
        .map((trait) => (
          <TooltipCheckbox
            key={trait.id}
            checked={activeTraits[trait.id] === true}
            onChange={(value) =>
              dispatch({ type: 'activeTrait', id: trait.id, value })
            }
            tooltip={trait.tooltip}
          >
            {trait.label} (+{trait.flatDamage ?? 0})
          </TooltipCheckbox>
        ))}
    </>
  );
};
