import styles from '@/components/attacks/swing/AttackStatsAside.module.css';
import { Mono } from '@/components/ui/ui';
import type { StatTransition } from '@/core/attacks/statTransitions';

const DEF_SUFFIX = '+';

type AttackStatsAsideProps = {
  def: StatTransition;
  armor: StatTransition;
  hp: StatTransition;
  momentum: number;
};

type TransitionValueProps = {
  transition: StatTransition;
  suffix?: string;
};

/**
 * The value after this swing, preceded by the value before it and an arrow
 * when it changed. Each part has its own rail column so rows line up.
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
      <Mono className={styles.value}>
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
  return (
    <aside
      className={styles.rail}
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
        <Mono className={styles.value}>{momentum}</Mono>
      </div>
    </aside>
  );
};
