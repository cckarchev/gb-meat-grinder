import styled from 'styled-components';
import {
  PLAYBOOK,
  kdAlreadyTakenBeforePick,
  wrapExtendedNetNeeded,
  wrapSlotBudget,
  type WrapPick,
} from '../../core/playbook';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '../../core/probStyle';
import { formatPercent, probAttackSucceeds } from '../../core/probability';
import type { AttacksPanelProps } from './types';

const WrapSlotBlock = styled.div<{ $first: boolean }>`
  margin-top: ${(p) => (p.$first ? 0 : '0.85rem')};
  padding-top: ${(p) => (p.$first ? 0 : '0.65rem')};
  border-top: ${(p) => (p.$first ? 'none' : '1px solid var(--border)')};
  overflow-x: auto;
  /* Keep vertical overflow clipped (no phantom scrollbar with overflow-x: auto). */
  overflow-y: hidden;
`;

const ColumnGrid = styled.div<{ $columnCount: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => Math.max(1, p.$columnCount)}, 3.65rem);
  gap: 0.4rem;
  align-items: stretch;
  width: max-content;
  max-width: 100%;
  min-width: 0;
`;

const ColumnBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--input-bg);
`;

const ColumnResults = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding-bottom: 0.15rem;
`;

const ColumnHead = styled.div<{ $p: number }>`
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
`;

const LineButton = styled.button<{ $momentous: boolean; $selected: boolean }>`
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

  background: ${(p) =>
    p.$momentous ? '#b71c1c' : 'var(--playbook-line-nm-bg)'};
  color: ${(p) => (p.$momentous ? '#ffffff' : 'var(--playbook-line-nm-fg)')};
  border: 1px solid
    ${(p) => (p.$momentous ? '#7f1515' : 'var(--playbook-line-nm-border)')};

  &:hover {
    filter: brightness(1.06);
  }

  ${(p) =>
    p.$selected && p.$momentous
      ? `
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.92);
  `
      : p.$selected
        ? `
    box-shadow: inset 0 0 0 3px var(--playbook-line-nm-fg);
    outline: 2px solid var(--playbook-line-nm-fg);
    outline-offset: 2px;
  `
        : ''}

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    filter: none;
  }

  &:disabled:hover {
    filter: none;
  }
`;

export function WrapSlotPickGrid({
  attackIndex,
  pickIndex,
  tac,
  pHit,
  armor,
  maxNet,
  wrapPicks,
  firstSlotInSection,
  onChoiceChange,
}: {
  attackIndex: number;
  pickIndex: number;
  tac: number;
  pHit: number;
  armor: number;
  maxNet: number;
  wrapPicks: WrapPick[][];
  firstSlotInSection: boolean;
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
}) {
  const i = attackIndex;
  const budget = wrapSlotBudget(maxNet, pickIndex);
  const visibleColumns = PLAYBOOK.filter((c) => c.netSuccesses <= budget);

  return (
    <WrapSlotBlock $first={firstSlotInSection}>
      <ColumnGrid $columnCount={visibleColumns.length}>
        {visibleColumns.map((col) => {
          const netForHeat = wrapExtendedNetNeeded(pickIndex, col.netSuccesses);
          const pCol = probAttackSucceeds(tac, pHit, armor, netForHeat);
          return (
            <ColumnBlock key={col.netSuccesses}>
              <ColumnHead $p={pCol}>{formatPercent(pCol, 1)}</ColumnHead>
              <ColumnResults>
                {col.results.map((e) => {
                  const selected = wrapPicks[i][pickIndex] === e.id;
                  const kdLocked =
                    e.id === 'kd' &&
                    kdAlreadyTakenBeforePick(wrapPicks, i, pickIndex);
                  return (
                    <LineButton
                      key={e.id}
                      type="button"
                      disabled={kdLocked}
                      $momentous={e.momentum === true}
                      $selected={selected}
                      aria-pressed={selected}
                      title={
                        kdLocked
                          ? 'Knock Down already used this activation (target is KD)'
                          : undefined
                      }
                      onClick={() => {
                        if (pickIndex > 0 && selected) {
                          onChoiceChange(i, pickIndex, null);
                        } else {
                          onChoiceChange(i, pickIndex, e.id);
                        }
                      }}
                    >
                      {e.label}
                    </LineButton>
                  );
                })}
              </ColumnResults>
            </ColumnBlock>
          );
        })}
      </ColumnGrid>
    </WrapSlotBlock>
  );
}
