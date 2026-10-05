import { css } from 'styled-components';

/** Shared keyboard focus indicator for interactive elements. */
export const focusRing = css`
  &:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
`;

/** Small mono uppercase label set beside or above a value. */
export const monoCapsLabel = css`
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
  color: var(--muted);
`;

/** Bordered field surface shared by selects and input-style buttons. */
export const inputSurface = css`
  font: inherit;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text);
`;

/** Input-style button: the field surface plus hover lift and focus ring. */
export const inputButton = css`
  ${inputSurface}
  cursor: pointer;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--input-bg) 88%, var(--text));
    border-color: var(--muted);
  }

  ${focusRing}
`;
