import {
  LineButton,
  LineLabelStack,
} from '@/components/attacks/playbookLineStyles';
import { momentousLineStyle } from '@/core/momentum';
import { playbookLineDisplaySegments } from '@/core/playbookLabels';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/types/core/playbook';

const KD_LOCKED_TITLE =
  'Knock Down unavailable: the target is already Knocked Down (only one KD applies)';

type PlaybookLineButtonProps = {
  id: PlaybookChoiceId;
  damageMods: PlaybookDamageMods;
  selected: boolean;
  /** Knock Down already applied earlier, so this line cannot be picked. */
  kdLocked: boolean;
  /** Formatted hit chance for this line's column, for the accessible label. */
  hitChanceLabel: string;
  onClick: () => void;
};

/** One playbook result, drawn as a round pick button. */
export const PlaybookLineButton = ({
  id,
  damageMods,
  selected,
  kdLocked,
  hitChanceLabel,
  onClick,
}: PlaybookLineButtonProps) => {
  const { attacker } = useMeatGrinderSimulation();
  const momentousStyle = momentousLineStyle(attacker, id, damageMods);
  const segments = playbookLineDisplaySegments(attacker, id, damageMods);
  const action = selected ? 'Selected' : 'Select';

  return (
    <LineButton
      type="button"
      disabled={kdLocked}
      $momentous={momentousStyle === 'heat'}
      $momentousZeroEffective={momentousStyle === 'zeroed'}
      $momentousColor={attacker.guild.color}
      $selected={selected}
      aria-pressed={selected}
      aria-label={`${action} playbook result ${segments.join(' ')}, ${hitChanceLabel} to hit`}
      title={kdLocked ? KD_LOCKED_TITLE : undefined}
      onClick={onClick}
    >
      {segments.length > 1 ? (
        <LineLabelStack>
          {segments.map((seg, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: label segments are static and may repeat
            <span key={idx}>{seg}</span>
          ))}
        </LineLabelStack>
      ) : (
        segments[0]
      )}
    </LineButton>
  );
};
