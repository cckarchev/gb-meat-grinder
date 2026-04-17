import styled from 'styled-components';
import { narrowViewport } from '../styles/breakpoints';

export const Panel = styled.section`
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
  background: var(--panel);

  ${narrowViewport} {
    padding: 0.65rem 0.55rem;
    margin-bottom: 0.65rem;
    border-radius: 8px;
  }
`;

export const PanelTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
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
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th,
  td {
    padding: 0.5rem 0.45rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: none;
  }
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
