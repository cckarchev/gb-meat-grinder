import styles from '@/components/attacks/playbook/PlaybookLineButton.module.css';
import { momentousLineStyle } from '@/core/activation/momentousLines';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { playbookLineDisplaySegments } from '@/core/playbook/playbookLabels';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { CustomPropertyStyle } from '@/styles/customProperties';
import { dataFlag } from '@/styles/dataFlag';

const KNOCK_DOWN_LOCKED_TITLE =
  'Knock Down unavailable: the target is already Knocked Down or an earlier pick knocks it down (only one KD applies)';

type PlaybookLineButtonProps = {
  id: PlaybookChoiceId;
  selected: boolean;
  /** KD-only line after Knock Down already applied, so it cannot be picked. */
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
  const guildColorStyle: CustomPropertyStyle = {
    '--guild-color': attacker.guild.color,
  };

  return (
    <button
      className={styles.lineButton}
      style={guildColorStyle}
      type="button"
      disabled={knockDownLocked}
      data-momentous={momentousStyle}
      data-selected={dataFlag(selected)}
      aria-pressed={selected}
      aria-label={`${action} playbook result ${segments.join(' ')}, ${hitChanceLabel} to hit`}
      title={knockDownLocked ? KNOCK_DOWN_LOCKED_TITLE : undefined}
      onClick={onClick}
    >
      {segments.length > 1 ? (
        <span className={styles.labelStack}>
          {segments.map((segment, segmentIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: label segments are static and may repeat
            <span key={segmentIndex}>{segment}</span>
          ))}
        </span>
      ) : (
        segments[0]
      )}
    </button>
  );
};
