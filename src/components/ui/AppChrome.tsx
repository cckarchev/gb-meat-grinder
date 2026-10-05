import type { ReactNode } from 'react';
import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';

const Shell = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  text-align: left;

  ${narrowViewport} {
    padding: 0.75rem 0.5rem 1.5rem;
  }
`;

type AppChromeProps = {
  children: ReactNode;
};

export const AppChrome = ({ children }: AppChromeProps) => {
  return <Shell>{children}</Shell>;
};
