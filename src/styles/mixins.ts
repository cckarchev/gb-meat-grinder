import { css } from 'styled-components';

/** Shared keyboard focus indicator for interactive elements. */
export const focusRing = css`
  &:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
`;
