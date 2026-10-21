import type { DicePoolStripProps } from "@/components/attacks/swing/DicePoolStrip";
import { canAffordBonusTime } from "@/core/activation/bonusTimeFlags";
import { attackRowIsBerserker } from "@/core/attacks/attackRows";
import type { AttackRollContext } from "@/core/attacks/attackSequence.types";
import { rowHasWrapContinuation } from "@/core/playbook/wrapSlots";
import { MIN_PLAYBOOK_NET } from "@/core/shared/constants";
import { useMeatGrinderSimulation } from "@/gbMeatGrinder/useMeatGrinderSimulation";

type SwingDicePoolInput = {
  attack: AttackRollContext;
  maxNet: number;
  chargeAttackIndex: number;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  wrapOpen: boolean;
  onToggleWrapExpansion: () => void;
};

/** The dice pool toggles of one swing, wired to the plan state. */
export const useSwingDicePool = ({
  attack,
  maxNet,
  chargeAttackIndex,
  bonusTime,
  bonusTimeMomentumPool,
  wrapOpen,
  onToggleWrapExpansion,
}: SwingDicePoolInput): DicePoolStripProps => {
  const { attacker, charging, wrapPicks, dispatch } =
    useMeatGrinderSimulation();
  const attackIndex = attack.attackIndex;

  const hasWrapContinuation = rowHasWrapContinuation(wrapPicks[attackIndex]);
  const bonusTimeDisabled =
    !bonusTime && !canAffordBonusTime(bonusTimeMomentumPool);

  const handleWrapToggle = () => {
    if (wrapOpen) {
      dispatch({ type: "clearWrapContinuation", attackIndex });
    }

    onToggleWrapExpansion();
  };

  const handleCharge = () => {
    dispatch({ type: "chargeAttackIndex", value: attackIndex });
  };

  const handleBonusTimeChange = (value: boolean) => {
    dispatch({ type: "bonusTime", attackIndex, value });
  };

  return {
    attackIndex,
    tac: attack.tac,
    canCharge: charging && !attackRowIsBerserker(attacker, attackIndex),
    isCharge: chargeAttackIndex === attackIndex,
    onCharge: handleCharge,
    bonusTime,
    bonusTimeDisabled,
    onBonusTimeChange: handleBonusTimeChange,
    canWrap: hasWrapContinuation && maxNet >= MIN_PLAYBOOK_NET,
    wrapOpen,
    onWrapToggle: handleWrapToggle,
  };
};
