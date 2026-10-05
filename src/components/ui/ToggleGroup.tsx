import type { ReactNode } from 'react';
import styled from 'styled-components';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import { monoCapsLabel } from '@/styles/mixins';

/** Muted by default; guild groups pass the guild color. */
const GroupLabel = styled.div<{ $color?: string }>`
  ${monoCapsLabel}
  font-size: 0.72rem;
  color: ${({ $color }) => $color ?? 'var(--muted)'};
`;

const GroupList = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: 0 1rem;
  align-items: start;

  ${narrowViewport} {
    gap: 0 0.55rem;
  }

  ${extraNarrowViewport} {
    grid-template-columns: 1fr;
  }
`;

/** Panel footer holding toggle groups stacked with even spacing. */
export const ToggleGroupStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  ${narrowViewport} {
    gap: 0.6rem;
  }
`;

/** Two toggle groups side by side, stacked on the narrowest screens. */
export const ToggleGroupPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
  align-items: start;

  ${narrowViewport} {
    gap: 0.6rem 0.55rem;
  }

  ${extraNarrowViewport} {
    grid-template-columns: 1fr;
  }
`;

type ToggleGroupProps = {
  title: string;
  color?: string;
  columns?: number;
  children: ReactNode;
};

/** A titled group of checkbox rows (conditions, guild buffs, ...). */
export const ToggleGroup = ({
  title,
  color,
  columns = 1,
  children,
}: ToggleGroupProps) => {
  return (
    <section>
      <GroupLabel $color={color}>{title}</GroupLabel>
      <GroupList $columns={columns}>{children}</GroupList>
    </section>
  );
};
