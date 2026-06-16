import styled from 'styled-components';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import { focusRing } from '@/styles/mixins';
import {
  kdAlreadyTakenBeforePick,
  momentousLineStyle,
  playbookLineDisplaySegments,
  wrapExtendedNetNeeded,
  wrapSlotBudget,
} from '@/core/playbook';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { PlaybookDamageMods, WrapPick } from '@/types/core/playbook';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '@/core/probStyle';
import { formatPercent, probAttackSucceeds } from '@/core/probability';
import type { AttacksPanelProps } from '@/types/components/attacks';
import {
  PLAYBOOK_COLUMN_TRACK,
  PLAYBOOK_COLUMN_WIDTH_VAR,
  PLAYBOOK_GRID_GAP,
} from '@/components/attacks/playbookLayout';

const WrapSlotBlock = styled.div<{ $first: boolean }>`
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

const ColumnGrid = styled.div<{ $columnCount: number }>`
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
    /* Same fixed track as wrap control; scroll horizontally instead of stretching. */
    gap: 0.22rem;
  }

  ${extraNarrowViewport} {
    gap: 0.14rem;
  }
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

const LineButton = styled.button<{
  $momentous: boolean;
  $momentousZeroEffective: boolean;
  $momentousColor: string;
  $selected: boolean;
}>`
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
  transition:
    box-shadow 0.12s ease,
    outline 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: ${(p) =>
    p.$momentous
      ? p.$momentousColor
      : p.$momentousZeroEffective
        ? '#ffffff'
        : 'var(--playbook-line-nm-bg)'};
  color: ${(p) => (p.$momentous ? '#ffffff' : 'var(--playbook-line-nm-fg)')};
  border: 1px solid
    ${(p) =>
      p.$momentous
        ? `color-mix(in srgb, ${p.$momentousColor} 60%, #000)`
        : 'var(--playbook-line-nm-border)'};

  &:hover {
    filter: brightness(1.06);
  }

  ${focusRing}

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

/** Stacks multi-effect line segments (e.g. `3` / `GB`) inside the circle. */
const LineLabelStack = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
  gap: 0.12em;
`;

export function WrapSlotPickGrid({
  attackIndex,
  pickIndex,
  tac,
  pHit,
  armor,
  maxNet,
  wrapPicks,
  damageMods,
  activeBaseCount,
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
  damageMods: PlaybookDamageMods;
  activeBaseCount: number;
  firstSlotInSection: boolean;
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
}) {
  const { attacker, enemyKnockedDown } = useMeatGrinderSimulation();
  const i = attackIndex;
  const budget = wrapSlotBudget(attacker, maxNet, pickIndex);
  const visibleColumns = attacker.playbook.filter(
    (c) => c.netSuccesses <= budget,
  );

  return (
    <WrapSlotBlock $first={firstSlotInSection}>
      <ColumnGrid $columnCount={visibleColumns.length}>
        {visibleColumns.map((col) => {
          const netForHeat = wrapExtendedNetNeeded(
            attacker,
            pickIndex,
            col.netSuccesses,
          );
          const pCol = probAttackSucceeds(tac, pHit, armor, netForHeat);
          return (
            <ColumnBlock key={col.netSuccesses}>
              <ColumnHead $p={pCol}>{formatPercent(pCol, 1)}</ColumnHead>
              <ColumnResults>
                {col.results.map((e) => {
                  const selected = wrapPicks[i][pickIndex] === e.id;
                  const mStyle = momentousLineStyle(attacker, e.id, damageMods);
                  const segments = playbookLineDisplaySegments(
                    attacker,
                    e.id,
                    damageMods,
                  );
                  const kdLocked =
                    e.appliesKnockDown === true &&
                    kdAlreadyTakenBeforePick(
                      attacker,
                      wrapPicks,
                      i,
                      pickIndex,
                      damageMods,
                      activeBaseCount,
                      enemyKnockedDown,
                    );
                  return (
                    <LineButton
                      key={e.id}
                      type="button"
                      disabled={kdLocked}
                      $momentous={mStyle === 'heat'}
                      $momentousZeroEffective={mStyle === 'zeroed'}
                      $momentousColor={attacker.guild.color}
                      $selected={selected}
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Selected' : 'Select'} playbook result ${segments.join(
                        ' ',
                      )}, ${formatPercent(pCol, 1)} to hit`}
                      title={
                        kdLocked
                          ? 'Knock Down unavailable: the target is already Knocked Down (only one KD applies)'
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
                      {segments.length > 1 ? (
                        <LineLabelStack>
                          {segments.map((seg, idx) => (
                            <span key={idx}>{seg}</span>
                          ))}
                        </LineLabelStack>
                      ) : (
                        segments[0]
                      )}
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
