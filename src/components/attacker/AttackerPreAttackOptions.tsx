import {
  LABEL_ACTIVATED_TRAITS,
  LABEL_CHARGE_COST,
  LABEL_CHARGE_COST_FURIOUS,
  LABEL_CHARGING,
  LABEL_GUILD_BUFFS,
  labelActivatedTrait,
  TOOLTIP_CHARGE,
  TOOLTIP_CHARGE_FURIOUS,
} from '@/components/attacker/attackerPanelCopy';
import { GuildBuffCheckbox } from '@/components/ui/GuildBuffCheckbox';
import { ToggleGroup, ToggleGroupStack } from '@/components/ui/ToggleGroup';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import {
  activatableTraits,
  guildBuffsFor,
} from '@/core/attackers/buffsAndTraits';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Charging, then guild buffs and activated traits under guild-colored titles. */
export const AttackerPreAttackOptions = () => {
  const { attacker, charging, activeTraits, dispatch } =
    useMeatGrinderSimulation();

  const chargeTooltip = attacker.furious
    ? TOOLTIP_CHARGE_FURIOUS
    : TOOLTIP_CHARGE;

  const chargeCostLabel = attacker.furious
    ? LABEL_CHARGE_COST_FURIOUS
    : LABEL_CHARGE_COST;

  const buffs = guildBuffsFor(attacker, 'attacker');

  const toggleableTraits = activatableTraits(attacker);

  return (
    <ToggleGroupStack>
      <TooltipCheckbox
        checked={charging}
        onChange={(value) => dispatch({ type: 'charging', value })}
        tooltip={chargeTooltip}
      >
        {LABEL_CHARGING}
        {chargeCostLabel}
      </TooltipCheckbox>
      {buffs.length > 0 ? (
        <ToggleGroup title={LABEL_GUILD_BUFFS} color={attacker.guild.color}>
          {buffs.map((buff) => (
            <GuildBuffCheckbox key={buff.id} buff={buff} />
          ))}
        </ToggleGroup>
      ) : null}
      {toggleableTraits.length > 0 ? (
        <ToggleGroup
          title={LABEL_ACTIVATED_TRAITS}
          color={attacker.guild.color}
        >
          {toggleableTraits.map((trait) => (
            <TooltipCheckbox
              key={trait.id}
              checked={activeTraits[trait.id] === true}
              onChange={(value) =>
                dispatch({ type: 'activeTrait', id: trait.id, value })
              }
              tooltip={trait.tooltip}
            >
              {labelActivatedTrait(trait.label, trait.flatDamage ?? 0)}
            </TooltipCheckbox>
          ))}
        </ToggleGroup>
      ) : null}
    </ToggleGroupStack>
  );
};
