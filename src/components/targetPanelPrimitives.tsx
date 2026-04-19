import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';

export const BuffOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.35rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.35;

  input {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  ${narrowViewport} {
    font-size: 0.82rem;
  }
`;
