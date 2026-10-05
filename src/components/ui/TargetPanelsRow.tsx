import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '@/components/ui/ui';
import { narrowViewport } from '@/styles/breakpoints';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1rem;

  > ${Panel} {
    flex: 1 1 240px;
    margin-bottom: 0;
  }

  ${narrowViewport} {
    gap: 0.55rem;
    margin-bottom: 0.65rem;
  }
`;

type TargetPanelsRowProps = {
  children: ReactNode;
};

export const TargetPanelsRow = ({ children }: TargetPanelsRowProps) => {
  return <Row>{children}</Row>;
};
