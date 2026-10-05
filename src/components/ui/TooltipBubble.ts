import styled from 'styled-components';

type TooltipBubbleSize = 'compact' | 'regular';

type TooltipBubbleMetrics = {
  offset: string;
  maxWidth: string;
  padding: string;
  fontSize: string;
};

const TOOLTIP_BUBBLE_METRICS: Record<TooltipBubbleSize, TooltipBubbleMetrics> =
  {
    compact: {
      offset: '0.35rem',
      maxWidth: '16rem',
      padding: '0.45rem 0.55rem',
      fontSize: '0.74rem',
    },
    regular: {
      offset: '0.4rem',
      maxWidth: '18rem',
      padding: '0.5rem 0.6rem',
      fontSize: '0.78rem',
    },
  };

/**
 * Popover panel anchored below its `position: relative` parent. Resets the
 * typography it would otherwise inherit from buttons and uppercase labels.
 */
export const TooltipBubble = styled.span<{ $size: TooltipBubbleSize }>`
  position: absolute;
  top: calc(100% + ${(props) => TOOLTIP_BUBBLE_METRICS[props.$size].offset});
  left: 0;
  z-index: 20;
  width: max-content;
  max-width: min(${(props) => TOOLTIP_BUBBLE_METRICS[props.$size].maxWidth}, 80vw);
  padding: ${(props) => TOOLTIP_BUBBLE_METRICS[props.$size].padding};
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--popover-bg);
  color: var(--text);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-size: ${(props) => TOOLTIP_BUBBLE_METRICS[props.$size].fontSize};
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  text-align: left;
  letter-spacing: normal;
  text-transform: none;
`;
