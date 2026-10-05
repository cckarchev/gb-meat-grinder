import styled from 'styled-components';
import { Mono } from '@/components/ui/ui';
import { narrowViewport } from '@/styles/breakpoints';

export const DicePoolBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  margin-bottom: 0.65rem;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--input-bg) 88%, var(--border));

  ${narrowViewport} {
    gap: 0.45rem 0.55rem;
    padding: 0.42rem 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

export const PoolCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  min-width: 0;
  flex: 1 1 auto;
`;

/** TAC readout + wrap toggle (wrap lives here so the playbook row can use full width). */
export const TacPoolRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 0.35rem;
  border-left: 1px solid var(--border);

  ${narrowViewport} {
    flex: 1 1 100%;
    margin-left: 0;
    padding-left: 0;
    padding-top: 0.35rem;
    margin-top: 0.15rem;
    border-left: none;
    border-top: 1px solid var(--border);
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
`;

export const TacPoolBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.35rem;
  flex: 0 0 auto;
`;

export const TacPoolLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
  color: var(--muted);
`;

export const TacPoolValue = styled(Mono)`
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--text);

  ${narrowViewport} {
    font-size: 1.15rem;
  }
`;

/** Inline pill toggle (charge radio / bonus-time checkbox) inside the dice-pool strip. */
export const PoolToggle = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  color: ${(p) => (p.$disabled ? 'var(--muted)' : 'var(--text)')};
  font-size: 0.85rem;
  user-select: none;
`;
