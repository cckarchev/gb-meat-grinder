import { guildBuffsFor } from "@/core/attackers/buffsAndTraits";
import { assistNamedModels } from "@/core/character-plays/characterPlayEffects";
import { GuildBuffCheckbox } from "@/meat-grinder/shared/guild-buff-checkbox/GuildBuffCheckbox";
import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import { ToggleGroup } from "@/ui/toggle-group/ToggleGroup";
import { TooltipCheckbox } from "@/ui/tooltip-checkbox/TooltipCheckbox";
import {
  LABEL_GUILD_DEBUFFS,
  labelAssistEngaged,
  tooltipAssistEngaged,
} from "./panelCopy";

const DEBUFF_COLUMNS = 2;

/**
 * The attacker's guild debuffs already on the target (e.g. They Ain't Tough!),
 * titled in the guild color because they come from the attacker's guild. A
 * teammate named by the attacker's Assist engaging the target is listed here
 * too.
 */
export const GuildDebuffs = () => {
  const { attacker, damageMods, dispatch } = useMeatGrinderSimulation();

  const debuffs = guildBuffsFor(attacker, "enemy");
  const assistNamed = assistNamedModels(attacker);
  const hasAssist = assistNamed.length > 0;

  if (debuffs.length === 0 && !hasAssist) {
    return null;
  }

  return (
    <ToggleGroup
      title={LABEL_GUILD_DEBUFFS}
      color={attacker.guild.color}
      columns={DEBUFF_COLUMNS}
    >
      {debuffs.map((debuff) => (
        <GuildBuffCheckbox key={debuff.id} buff={debuff} />
      ))}
      {hasAssist ? (
        <TooltipCheckbox
          checked={damageMods.assistEngaged}
          onChange={(value) => dispatch({ type: "assistEngaged", value })}
          tooltip={tooltipAssistEngaged(assistNamed)}
        >
          {labelAssistEngaged(assistNamed)}
        </TooltipCheckbox>
      ) : null}
    </ToggleGroup>
  );
};
