import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';

/** Shared checkbox row used across the attacker and enemy panels. */
export const CheckOption = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.35rem;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.88rem;
  /* Dim the label text rather than the whole row, so a nested tooltip popover
     (which lives inside this label) stays fully legible when disabled. */
  color: ${({ $disabled }) => ($disabled ? 'var(--muted)' : 'var(--text)')};
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
    accent-color: var(--focus-ring);
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  }

  ${narrowViewport} {
    font-size: 0.82rem;
  }
`;
