import {
  LineButton,
  LineLabelStack,
} from '@/components/attacks/playbook/playbookLineStyles';
import { momentousLineStyle } from '@/core/activation/momentousLines';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { playbookLineDisplaySegments } from '@/core/playbook/playbookLabels';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const KNOCK_DOWN_LOCKED_TITLE =
  'Knock Down unavailable: the target is already Knocked Down or an earlier pick knocks it down (only one KD applies)';

type PlaybookLineButtonProps = {
  id: PlaybookChoiceId;
  selected: boolean;
  /** Knock Down already applied earlier, so this line cannot be picked. */
  knockDownLocked: boolean;
  /** Formatted hit chance for this line's column, for the accessible label. */
  hitChanceLabel: string;
  onClick: () => void;
};

/** One playbook result, drawn as a round pick button. */
export const PlaybookLineButton = ({
  id,
  selected,
  knockDownLocked,
  hitChanceLabel,
  onClick,
}: PlaybookLineButtonProps) => {
  const { attacker, damageMods } = useMeatGrinderSimulation();
  const momentousStyle = momentousLineStyle(attacker, id, damageMods);
  const segments = playbookLineDisplaySegments(attacker, id, damageMods);
  const action = selected ? 'Selected' : 'Select';

  return (
    <LineButton
      type="button"
      disabled={knockDownLocked}
      $momentous={momentousStyle === 'heat'}
      $momentousZeroed={momentousStyle === 'zeroed'}
      $momentousColor={attacker.guild.color}
      $selected={selected}
      aria-pressed={selected}
      aria-label={`${action} playbook result ${segments.join(' ')}, ${hitChanceLabel} to hit`}
      title={knockDownLocked ? KNOCK_DOWN_LOCKED_TITLE : undefined}
      onClick={onClick}
    >
      {segments.length > 1 ? (
        <LineLabelStack>
          {segments.map((segment, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: label segments are static and may repeat
            <span key={idx}>{segment}</span>
          ))}
        </LineLabelStack>
      ) : (
        segments[0]
      )}
    </LineButton>
  );
};
