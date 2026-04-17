import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { damageIfAllHitsWrap } from '../core/playbook';
import { AttackSwingRow } from './attacks/AttackSwingRow';
import type { AttacksPanelProps } from './attacks/types';
import { Panel } from './ui';

export type { AttacksPanelProps } from './attacks/types';

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export function AttacksPanel({
  targetHp,
  armor,
  chargeAttackIndex,
  onChargeAttackIndexChange,
  wrapPicks,
  gbFollowUps,
  onChoiceChange,
  onGbFollowUpChange,
  onWrapContinuationCleared,
  attacks,
}: AttacksPanelProps) {
  const [wrapExpanded, setWrapExpanded] = useState(() => new Set<number>());

  const toggleWrapExpanded = (attackIndex: number) => {
    setWrapExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(attackIndex)) next.delete(attackIndex);
      else next.add(attackIndex);
      return next;
    });
  };

  const rowDamageIfHit = useMemo(
    () => damageIfAllHitsWrap(wrapPicks),
    [wrapPicks],
  );
  const remainingHpAfterSwing = useMemo(() => {
    const out: number[] = [];
    let dealt = 0;
    for (const ctx of attacks) {
      dealt += rowDamageIfHit[ctx.attackIndex];
      out.push(Math.max(0, targetHp - dealt));
    }
    return out;
  }, [attacks, rowDamageIfHit, targetHp]);

  return (
    <Panel>
      <AttacksList>
        {attacks.map((a, displayIdx) => (
          <AttackSwingRow
            key={a.attackIndex}
            attack={a}
            displayIdx={displayIdx}
            armor={armor}
            chargeAttackIndex={chargeAttackIndex}
            wrapPicks={wrapPicks}
            gbFollowUps={gbFollowUps}
            remainingHpIfHit={remainingHpAfterSwing[displayIdx]}
            wrapOpen={wrapExpanded.has(a.attackIndex)}
            onChargeAttackIndexChange={onChargeAttackIndexChange}
            onChoiceChange={onChoiceChange}
            onGbFollowUpChange={onGbFollowUpChange}
            onToggleWrapExpansion={() => toggleWrapExpanded(a.attackIndex)}
            onWrapContinuationCleared={onWrapContinuationCleared}
          />
        ))}
      </AttacksList>
    </Panel>
  );
}
