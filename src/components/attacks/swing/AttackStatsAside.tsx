import styles from '@/components/attacks/swing/AttackStatsAside.module.css';
import { Mono } from '@/components/ui/ui';

type AttackStatsAsideProps = {
  defMinRoll: number;
  armor: number;
  momentum: number;
  remainingHpIfHit: number;
};

export const AttackStatsAside = ({
  defMinRoll,
  armor,
  momentum,
  remainingHpIfHit,
}: AttackStatsAsideProps) => {
  return (
    <aside
      className={styles.rail}
      aria-label="Defense, armor, HP after this swing, and momentum"
    >
      <div className={styles.statRow}>
        <span className={styles.caption}>DEF</span>
        <Mono className={styles.value}>{defMinRoll}+</Mono>
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>ARM</span>
        <Mono className={styles.value}>{armor}</Mono>
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>HP</span>
        <Mono className={styles.value}>{remainingHpIfHit}</Mono>
      </div>
      <div className={styles.statRow}>
        <span className={styles.caption}>Mom</span>
        <Mono className={styles.value}>{momentum}</Mono>
      </div>
    </aside>
  );
};
