import { useMemo, useState } from 'react';
import { clampAttackPlan, computeAttackSequence } from './attackSequence';
import { AppChrome } from './components/AppChrome';
import { AttacksPanel } from './components/AttacksPanel';
import { TargetPanel } from './components/TargetPanel';
import { BASE_ATTACK_COUNT, HP_DEFAULT } from './constants';
import {
  choiceUsesGbFollowUp,
  defaultGbFollowUpsWrap,
  defaultWrapPicks,
  type GbFollowUp,
  type GbFollowUpSlot,
  type PlaybookChoiceId,
  sanitizeGbFollowUpsWrap,
  type WrapPick,
} from './playbook';

type AttackPlan = {
  wrapPicks: WrapPick[][];
  gbFollowUps: GbFollowUpSlot[][];
};

function App() {
  const [def, setDef] = useState(4);
  const [armor, setArmor] = useState(1);
  const [hp, setHp] = useState(HP_DEFAULT);
  const [chargeAttackIndex, setChargeAttackIndex] = useState(0);
  const [attackPlan, setAttackPlan] = useState<AttackPlan>(() => {
    const wp = defaultWrapPicks();
    const gb = defaultGbFollowUpsWrap();
    const r = clampAttackPlan(wp, gb, 0, 1);
    return { wrapPicks: r.wrapPicks, gbFollowUps: r.gbFollowUps };
  });

  const { wrapPicks, gbFollowUps } = attackPlan;

  const { attacks } = useMemo(
    () =>
      computeAttackSequence(
        def,
        armor,
        wrapPicks,
        gbFollowUps,
        chargeAttackIndex,
      ),
    [def, armor, wrapPicks, gbFollowUps, chargeAttackIndex],
  );

  const applyClamp = (
    prev: AttackPlan,
    charge: number,
    arm: number,
  ): AttackPlan => {
    const r = clampAttackPlan(prev.wrapPicks, prev.gbFollowUps, charge, arm);
    if (r.wrapPicks === prev.wrapPicks && r.gbFollowUps === prev.gbFollowUps) {
      return prev;
    }
    return { wrapPicks: r.wrapPicks, gbFollowUps: r.gbFollowUps };
  };

  const setChoice = (
    attackIndex: number,
    pickIndex: number,
    id: PlaybookChoiceId | null,
  ) => {
    setAttackPlan((prev) => {
      if (pickIndex === 0 && id === null) return prev;
      if (prev.wrapPicks[attackIndex][pickIndex] === id) return prev;
      const nextPicks = prev.wrapPicks.map((row, idx) =>
        idx === attackIndex
          ? row.map((cur, j) => (j === pickIndex ? id : cur))
          : [...row],
      );
      const nextGb = prev.gbFollowUps.map((row, idx) => {
        if (idx !== attackIndex) return [...row];
        const nr = [...row];
        while (nr.length < nextPicks[idx].length) nr.push(null);
        if (id === null || !choiceUsesGbFollowUp(id)) nr[pickIndex] = null;
        else if (nr[pickIndex] == null) nr[pickIndex] = 'so';
        return nr.slice(0, nextPicks[idx].length);
      });
      return applyClamp(
        { wrapPicks: nextPicks, gbFollowUps: nextGb },
        chargeAttackIndex,
        armor,
      );
    });
  };

  const clearWrapContinuation = (attackIndex: number) => {
    setAttackPlan((prev) => {
      const row = prev.wrapPicks[attackIndex];
      if (row.length <= 1) return prev;
      const pick0 = row[0];
      let gb0: GbFollowUpSlot = prev.gbFollowUps[attackIndex]?.[0] ?? null;
      if (pick0 == null || !choiceUsesGbFollowUp(pick0)) gb0 = null;
      const nextPicks = prev.wrapPicks.map((r, idx) =>
        idx === attackIndex ? [pick0] : [...r],
      );
      const nextGb = prev.gbFollowUps.map((r, idx) =>
        idx === attackIndex ? [gb0] : [...r],
      );
      return applyClamp(
        { wrapPicks: nextPicks, gbFollowUps: nextGb },
        chargeAttackIndex,
        armor,
      );
    });
  };

  const setGbFollowUp = (
    attackIndex: number,
    pickIndex: number,
    follow: GbFollowUp,
  ) => {
    setAttackPlan((prev) => {
      if (prev.gbFollowUps[attackIndex]?.[pickIndex] === follow) return prev;
      const nextGb = prev.gbFollowUps.map((row, idx) => {
        if (idx !== attackIndex) return [...row];
        const nr = [...row];
        nr[pickIndex] = follow;
        return nr;
      });
      const { gb } = sanitizeGbFollowUpsWrap(prev.wrapPicks, nextGb);
      return applyClamp(
        { wrapPicks: prev.wrapPicks, gbFollowUps: gb },
        chargeAttackIndex,
        armor,
      );
    });
  };

  const handleArmorChange = (nextArmor: number) => {
    setArmor(nextArmor);
    setAttackPlan((prev) => applyClamp(prev, chargeAttackIndex, nextArmor));
  };

  const handleChargeAttackIndexChange = (index: number) => {
    const clamped = Math.max(0, Math.min(BASE_ATTACK_COUNT - 1, index));
    setChargeAttackIndex(clamped);
    setAttackPlan((prev) => applyClamp(prev, clamped, armor));
  };

  return (
    <AppChrome>
      <TargetPanel
        def={def}
        armor={armor}
        hp={hp}
        onDefChange={setDef}
        onArmorChange={handleArmorChange}
        onHpChange={setHp}
      />
      <AttacksPanel
        targetHp={hp}
        armor={armor}
        chargeAttackIndex={chargeAttackIndex}
        onChargeAttackIndexChange={handleChargeAttackIndexChange}
        wrapPicks={wrapPicks}
        gbFollowUps={gbFollowUps}
        onChoiceChange={setChoice}
        onGbFollowUpChange={setGbFollowUp}
        onWrapContinuationCleared={clearWrapContinuation}
        attacks={attacks}
      />
    </AppChrome>
  );
}

export default App;
