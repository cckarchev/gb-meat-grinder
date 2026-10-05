import {
  LABEL_CHARGE_COST,
  LABEL_CHARGE_COST_FURIOUS,
  TOOLTIP_CHARGE,
  TOOLTIP_CHARGE_FURIOUS,
} from '@/components/attacker/attackerPanelCopy';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { guildBuffIsExcluded } from '@/core/damage/damage';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Charging, guild buffs and activated traits toggled before the attack. */
export const AttackerPreAttackOptions = () => {
  const { attacker, charging, damageMods, activeTraits, dispatch } =
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
      {attacker.guild.buffs.map((buff) => {
        const excluded = guildBuffIsExcluded(attacker, buff.id);

        const tooltip = excluded
          ? `${buff.tooltip} (not available to ${attacker.name})`
          : buff.tooltip;

        return (
          <TooltipCheckbox
            key={buff.id}
            disabled={excluded}
            checked={!excluded && damageMods.buffs[buff.id] === true}
            onChange={(value) =>
              dispatch({ type: 'guildBuff', id: buff.id, value })
            }
            tooltip={tooltip}
          >
            {buff.label}
          </TooltipCheckbox>
        );
      })}
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
