import styles from '@/components/attacks/swing/AttackStatsAside.module.css';
import { Mono } from '@/components/ui/ui';
import type { StatTransition } from '@/core/attacks/statTransitions';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { dataFlag } from '@/styles/dataFlag';
import { guildColorStyle } from '@/styles/guildColorStyle';

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
  const changed = from !== to;

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

type StatRowProps = TransitionValueProps & {
  caption: string;
};

/** One stat on the rail: its caption, then its before and after values. */
const StatRow = ({ caption, transition, suffix }: StatRowProps) => {
  return (
    <div className={styles.statRow}>
      <span className={styles.caption}>{caption}</span>
      <TransitionValue transition={transition} suffix={suffix} />
    </div>
  );
};

export const AttackStatsAside = ({
  def,
  armor,
  hp,
  momentum,
}: AttackStatsAsideProps) => {
  const { attacker } = useMeatGrinderSimulation();

  return (
    <aside
      className={styles.rail}
      style={guildColorStyle(attacker.guild.color)}
      aria-label="Defense, armor, HP and momentum before and after this swing"
    >
      <StatRow caption="DEF" transition={def} suffix={DEF_SUFFIX} />
      <StatRow caption="ARM" transition={armor} />
      <StatRow caption="HP" transition={hp} />
      <StatRow caption="Mom" transition={momentum} />
    </aside>
  );
};
