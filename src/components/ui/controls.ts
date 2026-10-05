import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import { focusRing } from '@/styles/mixins';

/**
 * Pill toggle / action button used for character-play selection and the Reset
 * control. `$active` renders the filled (selected) state.
 */
export const ToggleButton = styled.button<{ $active?: boolean }>`
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-button);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  /* Active = accent fill (CCK primary); inactive = teal-outline ghost. */
  background: ${(p) => (p.$active ? 'var(--accent)' : 'transparent')};
  color: ${(p) => (p.$active ? 'var(--accent-ink)' : 'var(--teal-bright)')};
  border: 1px solid
    ${(p) => (p.$active ? 'transparent' : 'var(--ghost-border)')};
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover:not(:disabled) {
    ${(p) =>
      p.$active
        ? 'opacity: 0.9;'
        : 'border-color: var(--ghost-border-hover); background: var(--ghost-bg);'}
  }

  ${focusRing}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  ${narrowViewport} {
    font-size: 0.78rem;
    padding: 0.4rem 0.6rem;
  }
`;
