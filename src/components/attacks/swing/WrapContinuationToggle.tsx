import styles from '@/components/attacks/swing/WrapContinuationToggle.module.css';
import {
  LABEL_WRAP_CLOSE,
  LABEL_WRAP_OPEN,
  TITLE_WRAP_CLOSE,
  TITLE_WRAP_OPEN,
} from '@/components/attacks/swing/wrapToggleCopy';
import { wrapSectionId, wrapTriggerId } from '@/components/attacks/wrapIds';
import { dataFlag } from '@/styles/dataFlag';

type WrapContinuationToggleProps = {
  attackIndex: number;
  wrapOpen: boolean;
  onClick: () => void;
};

/** Opens / closes extra wrap slots (shown beside the pool readout in the dice pool strip). */
export const WrapContinuationToggle = ({
  attackIndex,
  wrapOpen,
  onClick,
}: WrapContinuationToggleProps) => {
  return (
    <button
      className={styles.toggleButton}
      type="button"
      id={wrapTriggerId(attackIndex)}
      aria-expanded={wrapOpen}
      aria-controls={wrapSectionId(attackIndex)}
      title={wrapOpen ? TITLE_WRAP_CLOSE : TITLE_WRAP_OPEN}
      onClick={onClick}
    >
      <span>{wrapOpen ? LABEL_WRAP_CLOSE : LABEL_WRAP_OPEN}</span>
      <span
        className={styles.caret}
        data-open={dataFlag(wrapOpen)}
        aria-hidden
      />
    </button>
  );
};
