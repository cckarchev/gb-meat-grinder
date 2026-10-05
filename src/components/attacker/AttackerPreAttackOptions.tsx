import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { guildBuffIsExcluded } from '@/core/damage/damage';
import { CHARGE_INFLUENCE_COST } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/** Charging, guild buffs and special abilities toggled before the attack. */
export const AttackerPreAttackOptions = () => {
  const { attacker, charging, damageMods, specialAbilities, dispatch } =
    useMeatGrinderSimulation();

  const chargeTooltip = attacker.furious
    ? 'Charge this activation (free for Furious).'
    : `Charge this activation (costs ${CHARGE_INFLUENCE_COST} influence).`;

  const chargeCostLabel = attacker.furious
    ? ' (free)'
    : ` (-${CHARGE_INFLUENCE_COST} influence)`;

  const setBuff = (buffId: string, value: boolean) => {
    dispatch({
      type: 'damageMods',
      value: {
        ...damageMods,
        buffs: { ...damageMods.buffs, [buffId]: value },
      },
    });
  };

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
            onChange={(value) => setBuff(buff.id, value)}
            tooltip={tooltip}
          >
            {buff.label}
          </TooltipCheckbox>
        );
      })}
      {(attacker.specialAbilities ?? []).map((ability) => (
        <TooltipCheckbox
          key={ability.id}
          checked={specialAbilities[ability.id] === true}
          onChange={(value) =>
            dispatch({ type: 'specialAbility', id: ability.id, value })
          }
          tooltip={ability.tooltip}
        >
          {ability.label} (+{ability.flatDamage})
        </TooltipCheckbox>
      ))}
    </>
  );
};
