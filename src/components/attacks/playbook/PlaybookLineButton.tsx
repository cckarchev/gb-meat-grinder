import styles from '@/components/attacks/playbook/PlaybookLineButton.module.css';
import { momentousLineStyle } from '@/core/activation/momentousLines';
import { swingDamageMods } from '@/core/attacks/activationTimeline';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { playbookLineDisplaySegments } from '@/core/playbook/playbookLabels';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { dataFlag } from '@/styles/dataFlag';
import { guildColorStyle } from '@/styles/guildColorStyle';

/** Why a line cannot be picked: its once-per-activation effect is already used. */
export type PlaybookLineLock = 'knockDown' | 'tackle';

const LOCKED_TITLES: Record<PlaybookLineLock, string> = {
  knockDown:
    'Knock Down unavailable: the target is already Knocked Down or an earlier pick knocks it down (only one KD applies)',
  tackle:
    'Tackle unavailable: an earlier pick already tackled and took the ball (only one Tackle applies)',
};

type PlaybookLineButtonProps = {
  /** The swing this line belongs to, for its +DMG (Burning Passion, Assist). */
  attackIndex: number;
  id: PlaybookChoiceId;
  selected: boolean;
  /** Set when the line cannot be picked: its KD or Tackle is already used. */
  lock: PlaybookLineLock | undefined;
  /** Formatted hit chance for this line's column, for the accessible label. */
  hitChanceLabel: string;
  onClick: () => void;
};

/** One playbook result, drawn as a round pick button. */
export const PlaybookLineButton = ({
  attackIndex,
  id,
  selected,
  lock,
  hitChanceLabel,
  onClick,
}: PlaybookLineButtonProps) => {
  const { attacker, damageMods, timeline } = useMeatGrinderSimulation();
  const swingMods = swingDamageMods(damageMods, timeline, attackIndex);
  const momentousStyle = momentousLineStyle(attacker, id, swingMods);
  const segments = playbookLineDisplaySegments(attacker, id, swingMods);
  const action = selected ? 'Selected' : 'Select';
  const locked = lock !== undefined;
  const lockedTitle = locked ? LOCKED_TITLES[lock] : undefined;

  return (
    <button
      className={styles.lineButton}
      style={guildColorStyle(attacker.guild.color)}
      type="button"
      disabled={locked}
      data-momentous={momentousStyle}
      data-selected={dataFlag(selected)}
      aria-pressed={selected}
      aria-label={`${action} playbook result ${segments.join(' ')}, ${hitChanceLabel} to hit`}
      title={lockedTitle}
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
