import styled from 'styled-components';
import { PanelTitle } from '@/components/ui';

export const ProbabilitySummaryTitle = styled(PanelTitle)`
  margin-bottom: 0.5rem;
`;

export const TotalsSectionTitle = styled(ProbabilitySummaryTitle)`
  margin-top: 1rem;
`;

export const ProbabilityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  padding: 0.2rem 0.4rem;
  margin: 0 -0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text);
  transition: background-color 0.1s ease;

  &:hover {
    background: var(--row-hover);
  }
`;

export const SelectionLine = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.35;
`;

export const SelectionPicksInline = styled.span`
  color: var(--muted);
  font-weight: 500;
`;

export const OddsAggregateBlock = styled.div`
  margin-top: 0.2rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
`;
