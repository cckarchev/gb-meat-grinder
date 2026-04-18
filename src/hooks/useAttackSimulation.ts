import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAttackSequence } from '../core/attackSequence';
import {
  BASE_ATTACK_COUNT,
  HP_DEFAULT,
  INITIAL_TAC_MODIFIER_MAX,
  INITIAL_TAC_MODIFIER_MIN,
  MAX_ATTACK_COUNT,
} from '../core/constants';
import {
  clampAttackPlanState,
  createInitialAttackPlan,
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
  type AttackPlan,
  type AttackPlanClampParams,
} from '../core/attackPlanState';
import {
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  momentumPoolBeforeBonusTime,
  type CharacterPlayPick,
  type PlaybookChoiceId,
  type PlaybookDamageMods,
  sanitizeBonusTimeFlags,
} from '../core/playbook';

export function useAttackSimulation() {
  const [def, setDef] = useState(4);
  const [armor, setArmor] = useState(1);
  const [hp, setHp] = useState(HP_DEFAULT);
  const [chargeAttackIndex, setChargeAttackIndex] = useState(0);
  const [enemyHasCover, setEnemyHasCover] = useState(false);
  const [startingMomentum, setStartingMomentum] = useState(0);
  const [initialTacModifier, setInitialTacModifier] = useState(0);
  const [bonusTimeByAttack, setBonusTimeByAttack] = useState<boolean[]>(() =>
    Array.from({ length: MAX_ATTACK_COUNT }, () => false),
  );
  const [damageMods, setDamageMods] = useState<PlaybookDamageMods>(
    DEFAULT_PLAYBOOK_DAMAGE_MODS,
  );
  const [attackPlan, setAttackPlan] = useState<AttackPlan>(createInitialAttackPlan);

  const { wrapPicks, characterPlayPicks } = attackPlan;

  const clampParams = useMemo<AttackPlanClampParams>(
    () => ({
      chargeAttackIndex,
      armor,
      enemyHasCover,
      damageMods,
      def,
      bonusTimeByAttack,
      initialTacModifier,
    }),
    [
      chargeAttackIndex,
      armor,
      enemyHasCover,
      damageMods,
      def,
      bonusTimeByAttack,
      initialTacModifier,
    ],
  );

  const clamp = useCallback(
    (prev: AttackPlan, overrides?: Partial<AttackPlanClampParams>) =>
      clampAttackPlanState(prev, { ...clampParams, ...overrides }),
    [clampParams],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setBonusTimeByAttack((prev) =>
        sanitizeBonusTimeFlags(wrapPicks, damageMods, startingMomentum, prev),
      );
    });
  }, [wrapPicks, damageMods, startingMomentum]);

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
        bonusTimeByAttack,
        initialTacModifier,
      ),
    [
      def,
      armor,
      wrapPicks,
      characterPlayPicks,
      chargeAttackIndex,
      enemyHasCover,
      damageMods,
      bonusTimeByAttack,
      initialTacModifier,
    ],
  );

  const setChoice = useCallback(
    (attackIndex: number, pickIndex: number, id: PlaybookChoiceId | null) => {
      setAttackPlan((prev) => {
        const next = nextPlanAfterWrapChoice(prev, attackIndex, pickIndex, id);
        return next == null ? prev : clamp(next);
      });
    },
    [clamp],
  );

  const clearWrapContinuation = useCallback(
    (attackIndex: number) => {
      setAttackPlan((prev) => {
        const next = nextPlanAfterClearWrapContinuation(prev, attackIndex);
        return next == null ? prev : clamp(next);
      });
    },
    [clamp],
  );

  const setCharacterPlayPick = useCallback(
    (attackIndex: number, pickIndex: number, pick: CharacterPlayPick) => {
      setAttackPlan((prev) => {
        const next = nextPlanAfterCharacterPlayPick(
          prev,
          attackIndex,
          pickIndex,
          pick,
          damageMods,
        );
        return next == null ? prev : clamp(next);
      });
    },
    [clamp, damageMods],
  );

  const handleArmorChange = useCallback(
    (nextArmor: number) => {
      setArmor(nextArmor);
      setAttackPlan((prev) => clamp(prev, { armor: nextArmor }));
    },
    [clamp],
  );

  const handleChargeAttackIndexChange = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(BASE_ATTACK_COUNT - 1, index));
      setChargeAttackIndex(clamped);
      setAttackPlan((prev) => clamp(prev, { chargeAttackIndex: clamped }));
    },
    [clamp],
  );

  const handleEnemyHasCoverChange = useCallback(
    (cover: boolean) => {
      setEnemyHasCover(cover);
      setAttackPlan((prev) => clamp(prev, { enemyHasCover: cover }));
    },
    [clamp],
  );

  const handleDamageModsChange = useCallback(
    (next: PlaybookDamageMods) => {
      setDamageMods(next);
      setAttackPlan((prev) => clamp(prev, { damageMods: next }));
    },
    [clamp],
  );

  const handleDefChange = useCallback(
    (nextDef: number) => {
      setDef(nextDef);
      setAttackPlan((prev) => clamp(prev, { def: nextDef }));
    },
    [clamp],
  );

  const handleInitialTacModifierChange = useCallback(
    (value: number) => {
      const clamped = Math.max(
        INITIAL_TAC_MODIFIER_MIN,
        Math.min(INITIAL_TAC_MODIFIER_MAX, value),
      );
      setInitialTacModifier(clamped);
      setAttackPlan((prev) => clamp(prev, { initialTacModifier: clamped }));
    },
    [clamp],
  );

  const handleBonusTimeChange = useCallback(
    (attackIndex: number, value: boolean) => {
      setBonusTimeByAttack((prev) => {
        if (value) {
          const pool = momentumPoolBeforeBonusTime(
            wrapPicks,
            damageMods,
            attackIndex,
            startingMomentum,
            prev,
          );
          if (pool < 1) return prev;
        }
        const next = [...prev];
        next[attackIndex] = value;
        return sanitizeBonusTimeFlags(
          wrapPicks,
          damageMods,
          startingMomentum,
          next,
        );
      });
    },
    [wrapPicks, damageMods, startingMomentum],
  );

  return {
    def,
    armor,
    hp,
    chargeAttackIndex,
    enemyHasCover,
    startingMomentum,
    initialTacModifier,
    damageMods,
    bonusTimeByAttack,
    wrapPicks,
    characterPlayPicks,
    attacks,
    setHp,
    setStartingMomentum,
    handleArmorChange,
    handleChargeAttackIndexChange,
    handleEnemyHasCoverChange,
    handleDamageModsChange,
    handleDefChange,
    handleInitialTacModifierChange,
    handleBonusTimeChange,
    setChoice,
    clearWrapContinuation,
    setCharacterPlayPick,
  };
}

export type AttackSimulation = ReturnType<typeof useAttackSimulation>;
