import { useMemo, useState } from 'react';
import { clampAttackPlan, computeAttackSequence } from './core/attackSequence';
import { AppChrome } from './components/AppChrome';
import { AttacksPanel } from './components/AttacksPanel';
import { TargetPanel } from './components/TargetPanel';
import { BASE_ATTACK_COUNT, HP_DEFAULT } from './core/constants';
import {
  choiceUsesCharacterPlay,
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
  type CharacterPlayPick,
  type CharacterPlayPickSlot,
  type PlaybookChoiceId,
  type PlaybookDamageMods,
  sanitizeCharacterPlayPicksWrap,
  type WrapPick,
} from './core/playbook';

type AttackPlan = {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
};

function App() {
  const [def, setDef] = useState(4);
  const [armor, setArmor] = useState(1);
  const [hp, setHp] = useState(HP_DEFAULT);
  const [chargeAttackIndex, setChargeAttackIndex] = useState(0);
  const [enemyHasCover, setEnemyHasCover] = useState(false);
  const [startingMomentum, setStartingMomentum] = useState(0);
  const [damageMods, setDamageMods] = useState<PlaybookDamageMods>(
    DEFAULT_PLAYBOOK_DAMAGE_MODS,
  );
  const [attackPlan, setAttackPlan] = useState<AttackPlan>(() => {
    const wp = defaultWrapPicks();
    const cp = defaultCharacterPlayPicksWrap();
    const r = clampAttackPlan(
      wp,
      cp,
      0,
      1,
      false,
      DEFAULT_PLAYBOOK_DAMAGE_MODS,
      4,
    );
    return { wrapPicks: r.wrapPicks, characterPlayPicks: r.characterPlayPicks };
  });

  const { wrapPicks, characterPlayPicks } = attackPlan;

  const { attacks } = useMemo(
    () =>
      computeAttackSequence(
        def,
        armor,
        wrapPicks,
        characterPlayPicks,
        chargeAttackIndex,
        enemyHasCover,
        damageMods,
      ),
    [
      def,
      armor,
      wrapPicks,
      characterPlayPicks,
      chargeAttackIndex,
      enemyHasCover,
      damageMods,
    ],
  );

  const applyClamp = (
    prev: AttackPlan,
    charge: number,
    arm: number,
    cover: boolean,
    mods: PlaybookDamageMods,
    baseDef: number,
  ): AttackPlan => {
    const r = clampAttackPlan(
      prev.wrapPicks,
      prev.characterPlayPicks,
      charge,
      arm,
      cover,
      mods,
      baseDef,
    );
    if (
      r.wrapPicks === prev.wrapPicks &&
      r.characterPlayPicks === prev.characterPlayPicks
    ) {
      return prev;
    }
    return { wrapPicks: r.wrapPicks, characterPlayPicks: r.characterPlayPicks };
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
      const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
        if (idx !== attackIndex) return [...row];
        const nr = [...row];
        while (nr.length < nextPicks[idx].length) nr.push(null);
        if (id === null || !choiceUsesCharacterPlay(id)) nr[pickIndex] = null;
        else if (nr[pickIndex] == null) nr[pickIndex] = 'so';
        return nr.slice(0, nextPicks[idx].length);
      });
      return applyClamp(
        { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay },
        chargeAttackIndex,
        armor,
        enemyHasCover,
        damageMods,
        def,
      );
    });
  };

  const clearWrapContinuation = (attackIndex: number) => {
    setAttackPlan((prev) => {
      const row = prev.wrapPicks[attackIndex];
      if (row.length <= 1) return prev;
      const pick0 = row[0];
      let cp0: CharacterPlayPickSlot =
        prev.characterPlayPicks[attackIndex]?.[0] ?? null;
      if (pick0 == null || !choiceUsesCharacterPlay(pick0)) cp0 = null;
      const nextPicks = prev.wrapPicks.map((r, idx) =>
        idx === attackIndex ? [pick0] : [...r],
      );
      const nextCharacterPlay = prev.characterPlayPicks.map((r, idx) =>
        idx === attackIndex ? [cp0] : [...r],
      );
      return applyClamp(
        { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay },
        chargeAttackIndex,
        armor,
        enemyHasCover,
        damageMods,
        def,
      );
    });
  };

  const setCharacterPlayPick = (
    attackIndex: number,
    pickIndex: number,
    pick: CharacterPlayPick,
  ) => {
    setAttackPlan((prev) => {
      if (prev.characterPlayPicks[attackIndex]?.[pickIndex] === pick)
        return prev;
      const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
        if (idx !== attackIndex) return [...row];
        const nr = [...row];
        nr[pickIndex] = pick;
        return nr;
      });
      const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicksWrap(
        prev.wrapPicks,
        nextCharacterPlay,
        damageMods,
      );
      return applyClamp(
        { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized },
        chargeAttackIndex,
        armor,
        enemyHasCover,
        damageMods,
        def,
      );
    });
  };

  const handleArmorChange = (nextArmor: number) => {
    setArmor(nextArmor);
    setAttackPlan((prev) =>
      applyClamp(
        prev,
        chargeAttackIndex,
        nextArmor,
        enemyHasCover,
        damageMods,
        def,
      ),
    );
  };

  const handleChargeAttackIndexChange = (index: number) => {
    const clamped = Math.max(0, Math.min(BASE_ATTACK_COUNT - 1, index));
    setChargeAttackIndex(clamped);
    setAttackPlan((prev) =>
      applyClamp(prev, clamped, armor, enemyHasCover, damageMods, def),
    );
  };

  const handleEnemyHasCoverChange = (cover: boolean) => {
    setEnemyHasCover(cover);
    setAttackPlan((prev) =>
      applyClamp(prev, chargeAttackIndex, armor, cover, damageMods, def),
    );
  };

  const handleDamageModsChange = (next: PlaybookDamageMods) => {
    setDamageMods(next);
    setAttackPlan((prev) =>
      applyClamp(prev, chargeAttackIndex, armor, enemyHasCover, next, def),
    );
  };

  const handleDefChange = (nextDef: number) => {
    setDef(nextDef);
    setAttackPlan((prev) =>
      applyClamp(
        prev,
        chargeAttackIndex,
        armor,
        enemyHasCover,
        damageMods,
        nextDef,
      ),
    );
  };

  return (
    <AppChrome>
      <TargetPanel
        def={def}
        armor={armor}
        hp={hp}
        enemyHasCover={enemyHasCover}
        onEnemyHasCoverChange={handleEnemyHasCoverChange}
        damageMods={damageMods}
        onDamageModsChange={handleDamageModsChange}
        onDefChange={handleDefChange}
        onArmorChange={handleArmorChange}
        onHpChange={setHp}
        startingMomentum={startingMomentum}
        onStartingMomentumChange={setStartingMomentum}
      />
      <AttacksPanel
        targetHp={hp}
        armor={armor}
        chargeAttackIndex={chargeAttackIndex}
        onChargeAttackIndexChange={handleChargeAttackIndexChange}
        startingMomentum={startingMomentum}
        wrapPicks={wrapPicks}
        characterPlayPicks={characterPlayPicks}
        damageMods={damageMods}
        onChoiceChange={setChoice}
        onCharacterPlayPickChange={setCharacterPlayPick}
        onWrapContinuationCleared={clearWrapContinuation}
        attacks={attacks}
      />
    </AppChrome>
  );
}

export default App;
