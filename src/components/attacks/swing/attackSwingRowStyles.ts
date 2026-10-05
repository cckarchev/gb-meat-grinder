import styled from 'styled-components';
import {
  PLAYBOOK_COLUMN_TRACK,
  PLAYBOOK_COLUMN_WIDTH_VAR,
} from '@/components/attacks/playbook/playbookLayout';
import type { AttackBlockVariant } from '@/core/attacks/attackSequence.types';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';

export const AttackRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem 1.25rem;
  width: 100%;

  ${narrowViewport} {
    gap: 0.5rem 0.45rem;
  }
`;

export const AttackMain = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const AttackBlock = styled.div<{
  $variant: AttackBlockVariant;
  $disabled: boolean;
}>`
  position: relative;
  ${PLAYBOOK_COLUMN_WIDTH_VAR}: ${PLAYBOOK_COLUMN_TRACK};
  border-radius: var(--radius-lg);
  padding: 0.65rem 0.75rem 0.85rem;
  border: 1px solid var(--border);
  background: var(--panel);

  ${(p) =>
    p.$disabled
      ? `
    opacity: 0.5;
    filter: grayscale(0.6);
  `
      : ''}

  /* Focused (charge/berserker) attacks read via a crisp 1px accent border plus
     the corner brackets, with no heavy halo, which clashed with the brackets. */
  ${(p) =>
    p.$variant === 'charge'
      ? `
    border-color: var(--accent-charge);
    background: color-mix(in srgb, var(--accent-charge-soft) 16%, var(--panel));
  `
      : p.$variant === 'berserker'
        ? `
    border-color: var(--accent-berserker);
    background: color-mix(in srgb, var(--accent-berserker-soft) 16%, var(--panel));
  `
        : ''}

  ${narrowViewport} {
    ${PLAYBOOK_COLUMN_WIDTH_VAR}: clamp(2.15rem, 10.5vw, ${PLAYBOOK_COLUMN_TRACK});
    padding: 0.5rem 0.55rem 0.65rem;
    border-radius: var(--radius-md);
  }

  ${extraNarrowViewport} {
    ${PLAYBOOK_COLUMN_WIDTH_VAR}: clamp(1.75rem, 11vw, ${PLAYBOOK_COLUMN_TRACK});
    padding: 0.45rem 0.45rem 0.55rem;
  }
`;

export const AttackHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text);
  margin-bottom: 0.45rem;

  ${narrowViewport} {
    font-size: 0.85rem;
    margin-bottom: 0.35rem;
  }
`;

export const KillingBlowBadge = styled.span`
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-xs);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-ink);
  background: var(--accent-berserker);
  white-space: nowrap;
`;
