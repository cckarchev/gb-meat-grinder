import { tooltipExcludedBuff } from '@/components/ui/guildBuffCopy';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { guildBuffIsExcluded } from '@/core/damage/damage';
import type { GuildBuff } from '@/data/guilds/guild.types';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type GuildBuffCheckboxProps = {
  buff: GuildBuff;
};

/** A guild buff or debuff toggle, disabled for the model that is its source. */
export const GuildBuffCheckbox = ({ buff }: GuildBuffCheckboxProps) => {
  const { attacker, damageMods, dispatch } = useMeatGrinderSimulation();

  const excluded = guildBuffIsExcluded(attacker, buff.id);

  const tooltip = excluded
    ? tooltipExcludedBuff(buff.tooltip, attacker.name)
    : buff.tooltip;

  return (
    <TooltipCheckbox
      disabled={excluded}
      checked={!excluded && damageMods.buffs[buff.id] === true}
      onChange={(value) => dispatch({ type: 'guildBuff', id: buff.id, value })}
      tooltip={tooltip}
    >
      {buff.label}
    </TooltipCheckbox>
  );
};
