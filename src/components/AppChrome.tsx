import styled from 'styled-components';
import type { AppChromeProps } from '@/types/components/layout';
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

export function AppChrome({ children }: AppChromeProps) {
  return <Shell>{children}</Shell>;
}
