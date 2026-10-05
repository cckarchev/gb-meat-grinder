import styled from 'styled-components';
import { LABEL_GUILD_DEBUFFS } from '@/components/enemy/enemyPanelCopy';
import { GuildBuffCheckbox } from '@/components/ui/GuildBuffCheckbox';
import { guildBuffsFor } from '@/core/damage/damage';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { narrowViewport } from '@/styles/breakpoints';
import { monoCapsLabel } from '@/styles/mixins';

const DebuffsSection = styled.div`
  margin-top: 0.85rem;

  ${narrowViewport} {
    margin-top: 0.6rem;
  }
`;

/** Section label in the attacker's guild color: these come from the attacker's guild. */
const DebuffsLabel = styled.div<{ $color: string }>`
  ${monoCapsLabel}
  font-size: 0.72rem;
  color: ${({ $color }) => $color};
`;

/** The attacker's guild debuffs already on the target (e.g. They Ain't Tough!). */
export const EnemyGuildDebuffs = () => {
  const { attacker } = useMeatGrinderSimulation();

  const debuffs = guildBuffsFor(attacker, 'enemy');

  if (debuffs.length === 0) {
    return null;
  }

  return (
    <DebuffsSection>
      <DebuffsLabel $color={attacker.guild.color}>
        {LABEL_GUILD_DEBUFFS}
      </DebuffsLabel>
      {debuffs.map((debuff) => (
        <GuildBuffCheckbox key={debuff.id} buff={debuff} />
      ))}
    </DebuffsSection>
  );
};
