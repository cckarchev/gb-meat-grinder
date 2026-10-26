import { SwingPlaybook } from "@/components/attacks/playbook/SwingPlaybook";
import { AttackHeading } from "@/components/attacks/swing/AttackHeading";
import { AttackStatsAside } from "@/components/attacks/swing/AttackStatsAside";
import styles from "@/components/attacks/swing/AttackSwingRow.module.css";
import { DicePoolStrip } from "@/components/attacks/swing/DicePoolStrip";
import { useSwingDicePool } from "@/components/attacks/swing/useSwingDicePool";
import { CornerBrackets } from "@/components/ui/CornerBrackets";
import { attackKind } from "@/core/attacks/attackKind";
import type {
  AttackKind,
  AttackRollContext,
} from "@/core/attacks/attackSequence.types";
import type { StatTransition } from "@/core/attacks/statTransitions";
import { maxNetSuccessesForRoll } from "@/core/damage/probability";
import { useMeatGrinderSimulation } from "@/gbMeatGrinder/useMeatGrinderSimulation";
import { dataFlag } from "@/styles/dataFlag";

const CORNER_BRACKET_SIZE = 16;

/**
 * Kinds that stand out from a plain swing; their colors live in the CSS module.
 */
const ACCENTED_KINDS: ReadonlySet<AttackKind> = new Set([
  "charge",
  "berserker",
]);

/** Set by the CSS module on accented attack blocks, which wrap the brackets. */
const KIND_ACCENT_COLOR = "var(--kind-accent)";

/**
 * Per-swing values only `AttacksPanel` knows; shared plan state comes from
 * context.
 */
type AttackSwingRowProps = {
  attack: AttackRollContext;
  displayIndex: number;
  disabled: boolean;
  isKillingBlow: boolean;
  /** Charge row the engine uses: the chosen base, or none when not charging. */
  chargeAttackIndex: number;
  /** Enemy HP before this swing and after it if every pick hits. */
  hp: StatTransition;
  /** Momentum before this swing and after it if every pick hits. */
  momentum: StatTransition;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  wrapOpen: boolean;
  onToggleWrapExpansion: () => void;
};

export const AttackSwingRow = ({
  attack,
  displayIndex,
  disabled,
  isKillingBlow,
  chargeAttackIndex,
  hp,
  momentum,
  bonusTime,
  bonusTimeMomentumPool,
  wrapOpen,
  onToggleWrapExpansion,
}: AttackSwingRowProps) => {
  const { attacker } = useMeatGrinderSimulation();
  const attackIndex = attack.attackIndex;
  const maxNet = maxNetSuccessesForRoll(
    attack.tac,
    attack.armor,
    attack.netHitBonus,
  );

  const dicePool = useSwingDicePool({
    attack,
    maxNet,
    chargeAttackIndex,
    bonusTime,
    bonusTimeMomentumPool,
    wrapOpen,
    onToggleWrapExpansion,
  });

  // What this swing rolls against, then what it leaves on the target.
  const def: StatTransition = {
    from: attack.defMinRoll,
    to: attack.defMinRollAfter,
  };
  const armor: StatTransition = {
    from: attack.armor,
    to: attack.armorAfter,
  };

  const kind = attackKind(attacker, attackIndex, chargeAttackIndex);
  const accented = ACCENTED_KINDS.has(kind);

  return (
    <div className={styles.attackRow}>
      <div className={styles.attackMain}>
        <div
          className={styles.attackBlock}
          data-kind={kind}
          data-disabled={dataFlag(disabled)}
          inert={disabled}
        >
          {accented ? (
            <CornerBrackets
              accent={KIND_ACCENT_COLOR}
              size={CORNER_BRACKET_SIZE}
            />
          ) : null}
          <AttackHeading
            attackIndex={attackIndex}
            chargeAttackIndex={chargeAttackIndex}
            isKillingBlow={isKillingBlow}
          />
          <DicePoolStrip {...dicePool} />
          <SwingPlaybook
            attack={attack}
            displayIndex={displayIndex}
            maxNet={maxNet}
            wrapOpen={wrapOpen}
          />
        </div>
      </div>
      <AttackStatsAside def={def} armor={armor} hp={hp} momentum={momentum} />
    </div>
  );
};
