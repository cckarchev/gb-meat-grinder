import styled from 'styled-components';
import {
  PLAYBOOK_COLUMN_TRACK,
  PLAYBOOK_COLUMN_WIDTH_VAR,
  PLAYBOOK_GRID_GAP,
} from '@/components/attacks/playbook/playbookLayout';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '@/core/shared/probStyle';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';

export const WrapSlotBlock = styled.div<{ $first: boolean }>`
  margin-top: ${(p) => (p.$first ? 0 : '0.85rem')};
  padding-top: ${(p) => (p.$first ? 0 : '0.65rem')};
  border-top: ${(p) => (p.$first ? 'none' : '1px solid var(--border)')};
  overflow-x: auto;
  /* Keep vertical overflow clipped (no phantom scrollbar with overflow-x: auto). */
  overflow-y: hidden;

  ${narrowViewport} {
    margin-top: ${(p) => (p.$first ? 0 : '0.55rem')};
    padding-top: ${(p) => (p.$first ? 0 : '0.45rem')};
  }

  ${extraNarrowViewport} {
    margin-top: ${(p) => (p.$first ? 0 : '0.45rem')};
    padding-top: ${(p) => (p.$first ? 0 : '0.38rem')};
  }
`;

export const ColumnGrid = styled.div<{ $columnCount: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${(p) => Math.max(1, p.$columnCount)},
    var(${PLAYBOOK_COLUMN_WIDTH_VAR}, ${PLAYBOOK_COLUMN_TRACK})
  );
  gap: ${PLAYBOOK_GRID_GAP};
  align-items: stretch;
  width: max-content;
  max-width: 100%;
  min-width: 0;

  ${narrowViewport} {
    gap: 0.22rem;
  }

  ${extraNarrowViewport} {
    gap: 0.14rem;
  }
`;

export const ColumnBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--input-bg);
`;

export const ColumnResults = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding-top: 0.5rem;
  padding-bottom: 0.15rem;

  ${narrowViewport} {
    gap: 0.22rem;
    padding-top: 0.4rem;
    padding-bottom: 0.08rem;
  }

  ${extraNarrowViewport} {
    gap: 0.14rem;
    padding-top: 0.3rem;
    padding-bottom: 0.04rem;
  }
`;

export const ColumnHead = styled.div<{ $p: number }>`
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  padding: 0.4rem 0.35rem;
  line-height: 1.25;
  background: ${(p) => probHeatBackground(p.$p)};
  color: ${(p) => probHeatTextColor(p.$p)};
  border-bottom: 1px solid ${(p) => probHeatBorder(p.$p)};

  ${narrowViewport} {
    font-size: 0.62rem;
    padding: 0.28rem 0.2rem;
    letter-spacing: 0.02em;
  }

  ${extraNarrowViewport} {
    font-size: 0.56rem;
    padding: 0.22rem 0.12rem;
    letter-spacing: 0.01em;
  }
`;
