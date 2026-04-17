import type { ReactNode } from 'react';
import styled from 'styled-components';

const Shell = styled.div`
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  text-align: left;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  letter-spacing: -0.02em;
`;

/*
  Previously: Lead paragraph (TAC, 2 INF / six attacks, charge, wrap rules,
  columns, GB, KD, Berserker). Removed from UI per request.
*/

type AppChromeProps = {
  children: ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  return (
    <Shell>
      <Title>Can vBoar kill it?</Title>
      {children}
    </Shell>
  );
}
