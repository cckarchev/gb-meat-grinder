import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';

/** Groups the character-play picks and separates them from the playbook grid above. */
export const Section = styled.div`
  margin-top: 0.6rem;
  padding-top: 0.55rem;
  border-top: 1px dashed var(--border);

  ${narrowViewport} {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
  }
`;

export const SectionHeading = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--muted);
  margin-bottom: 0.4rem;
`;

/** One pick slot (each GB / 1GB result grants one). */
export const SlotRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  margin-top: 0.45rem;

  &:first-of-type {
    margin-top: 0;
  }

  ${narrowViewport} {
    gap: 0.35rem 0.4rem;
    margin-top: 0.35rem;
  }
`;

/** Small ordinal badge shown only when there is more than one pick slot. */
export const SlotTag = styled.span`
  flex: 0 0 auto;
  min-width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
`;

export const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  min-width: 0;
  flex: 1 1 auto;

  ${narrowViewport} {
    gap: 0.35rem 0.4rem;
  }
`;
