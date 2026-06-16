import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import { focusRing } from '@/styles/mixins';

/**
 * Pill toggle / action button used for character-play selection and the Reset
 * control. `$active` renders the filled (selected) state.
 */
export const ToggleButton = styled.button<{ $active?: boolean }>`
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  white-space: nowrap;
  background: ${(p) => (p.$active ? 'var(--text)' : 'var(--input-bg)')};
  color: ${(p) => (p.$active ? 'var(--bg)' : 'var(--text)')};
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    filter: brightness(1.05);
    border-color: var(--muted);
  }

  ${focusRing}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: none;
  }

  ${narrowViewport} {
    font-size: 0.8rem;
    padding: 0.38rem 0.55rem;
    border-radius: var(--radius-xs);
  }
`;
