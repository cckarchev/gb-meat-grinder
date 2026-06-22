import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';

export const Panel = styled.section`
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
  background: var(--panel);
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--border-hover);
  }

  ${narrowViewport} {
    padding: 0.65rem 0.55rem;
    margin-bottom: 0.65rem;
    border-radius: var(--radius-md);
  }
`;

export const PanelTitle = styled.h2`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
  color: var(--accent);
  margin: 0 0 0.75rem;

  ${narrowViewport} {
    margin-bottom: 0.5rem;
  }
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;

  ${narrowViewport} {
    gap: 0.55rem;
  }
`;

export const Select = styled.select`
  font: inherit;
  padding: 0.45rem 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
`;

export const Mono = styled.span`
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
`;

export const Summary = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.95rem;
`;
