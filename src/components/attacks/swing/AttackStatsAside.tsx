import styles from '@/components/attacks/swing/AttackStatsAside.module.css';
import { Mono } from '@/components/ui/ui';
import type { StatTransition } from '@/core/attacks/statTransitions';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { CustomPropertyStyle } from '@/styles/customProperties';
import { dataFlag } from '@/styles/dataFlag';

const DEF_SUFFIX = '+';

type AttackStatsAsideProps = {
  def: StatTransition;
  armor: StatTransition;
  hp: StatTransition;
  momentum: StatTransition;
};

type TransitionValueProps = {
  transition: StatTransition;
  suffix?: string;
};

/**
 * The value after this swing, preceded by the value before it and an arrow
 * when it changed, in which case the new value is a guild-colored chip. Each
 * part has its own rail column so rows line up.
 */
const TransitionValue = ({ transition, suffix = '' }: TransitionValueProps) => {
  const { from, to } = transition;
  const changed = from !== undefined && from !== to;

  return (
    <>
      {changed ? (
        <>
          <Mono className={styles.previous}>
            {from}
            {suffix}
          </Mono>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </>
      ) : null}
      <Mono className={styles.value} data-changed={dataFlag(changed)}>
        {to}
        {suffix}
      </Mono>
    </>
  );
};

export const AttackStatsAside = ({
  def,
  armor,
  hp,
  momentum,
}: AttackStatsAsideProps) => {
  const { attacker } = useMeatGrinderSimulation();
  const guildColorStyle: CustomPropertyStyle = {
    '--guild-color': attacker.guild.color,
  };

  return (
    <aside
      className={styles.rail}
      style={guildColorStyle}
      aria-label="Defense, armor, HP after this swing, and momentum"
    >
      <div className={styles.statRow}>
        <span className={styles.caption}>DEF</span>
        <TransitionValue transition={def} suffix={DEF_SUFFIX} />
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>ARM</span>
        <TransitionValue transition={armor} />
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>HP</span>
        <TransitionValue transition={hp} />
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>Mom</span>
        <TransitionValue transition={momentum} />
      </div>
    </aside>
  );
};
