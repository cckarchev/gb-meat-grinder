import { useId } from 'react';
import styles from '@/components/ui/StepControl.module.css';

/** How far one button press moves the value. */
const STEP = 1;

type StepControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** What the buttons change, for their labels: `armor` reads "Decrease armor". */
  ariaSubject: string;
  /** Shown inside the value box, e.g. `4+`. Defaults to the plain value. */
  valueLabel?: string;
};

export const StepControl = ({
  label,
  value,
  min,
  max,
  onChange,
  ariaSubject,
  valueLabel = String(value),
}: StepControlProps) => {
  const labelId = useId();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className={styles.field}>
      <span className={styles.labelText} id={labelId}>
        {label}
      </span>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset brings its own border, padding and min-width, so the group stays a labelled div. */}
      <div className={styles.controlRow} role="group" aria-labelledby={labelId}>
        <button
          className={styles.stepButton}
          type="button"
          aria-label={`Decrease ${ariaSubject}`}
          disabled={!canDecrease}
          onClick={() => onChange(Math.max(min, value - STEP))}
        >
          -
        </button>
        <span className={styles.valueDisplay}>{valueLabel}</span>
        <button
          className={styles.stepButton}
          type="button"
          aria-label={`Increase ${ariaSubject}`}
          disabled={!canIncrease}
          onClick={() => onChange(Math.min(max, value + STEP))}
        >
          +
        </button>
      </div>
    </div>
  );
};
