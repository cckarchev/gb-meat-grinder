import styled from 'styled-components';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import { focusRing } from '@/styles/mixins';

/** Fixed white in both themes: text on the guild color, and the fill of a zeroed momentous line. */
const LINE_WHITE = '#ffffff';

type LineButtonProps = {
  $momentous: boolean;
  $momentousZeroed: boolean;
  $momentousColor: string;
  $selected: boolean;
};

/** Guild color for a momentous line, white for a zeroed one, neutral otherwise. */
const lineBackground = (props: LineButtonProps): string => {
  if (props.$momentous) {
    return props.$momentousColor;
  }

  if (props.$momentousZeroed) {
    return LINE_WHITE;
  }

  return 'var(--playbook-line-nm-bg)';
};

/** Selection ring: an inner white ring on the guild color, an inset plus outline otherwise. */
const selectedRing = (props: LineButtonProps): string => {
  if (!props.$selected) {
    return '';
  }

  if (props.$momentous) {
    return `
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.92);
  `;
  }

  return `
    box-shadow: inset 0 0 0 3px var(--playbook-line-nm-fg);
    outline: 2px solid var(--playbook-line-nm-fg);
    outline-offset: 2px;
  `;
};

export const LineButton = styled.button<LineButtonProps>`
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  text-align: center;
  box-sizing: border-box;
  width: 2.45rem;
  height: 2.45rem;
  max-width: 100%;
  margin: 0 auto 0.25rem;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    box-shadow 0.12s ease,
    outline 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: ${lineBackground};
  color: ${(props) => (props.$momentous ? LINE_WHITE : 'var(--playbook-line-nm-fg)')};
  border: 1px solid
    ${(props) =>
      props.$momentous
        ? `color-mix(in srgb, ${props.$momentousColor} 60%, #000)`
        : 'var(--playbook-line-nm-border)'};

  &:hover {
    filter: brightness(1.06);
  }

  ${focusRing}

  ${selectedRing}

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    filter: none;
  }

  &:disabled:hover {
    filter: none;
  }

  ${narrowViewport} {
    width: min(2.2rem, 100%);
    height: auto;
    aspect-ratio: 1;
    max-width: 100%;
    font-size: clamp(0.55rem, 2.8vw, 0.66rem);
    margin-bottom: 0.12rem;
  }

  ${extraNarrowViewport} {
    width: min(1.85rem, 100%);
    font-size: clamp(0.48rem, 3.2vw, 0.58rem);
    margin-bottom: 0.08rem;
  }
`;

/** Stacks multi-effect line segments (e.g. `3` / `GB`) inside the circle. */
export const LineLabelStack = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
  gap: 0.12em;
`;
