export type StepControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Shown inside the value box, e.g. `4+` or `2` */
  valueLabel: string;
  hint?: string;
  decrementAriaLabel: string;
  incrementAriaLabel: string;
};
