import type { ComponentProps } from "react";
import { dataFlag } from "@/styles/dataFlag";
import { joinClassNames } from "@/styles/joinClassNames";
import styles from "./ToggleButton.module.css";

type ToggleButtonProps = ComponentProps<"button"> & {
  /** Renders the filled (selected) state. */
  active?: boolean;
};

/**
 * Pill toggle / action button used for character-play selection and the Reset
 * control.
 */
export const ToggleButton = ({
  active = false,
  className,
  ...props
}: ToggleButtonProps) => (
  <button
    className={joinClassNames(styles.toggleButton, className)}
    data-active={dataFlag(active)}
    {...props}
  />
);
