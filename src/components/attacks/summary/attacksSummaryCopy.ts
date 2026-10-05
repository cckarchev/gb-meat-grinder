import {
  DAMAGE_RANGE_HIGH_QUANTILE,
  DAMAGE_RANGE_LOW_QUANTILE,
} from '@/core/activation/summary/activationSummary';

const PERCENTILE_SCALE = 100;
const OUT_OF_TEN = 10;

const lowPercentile = Math.round(DAMAGE_RANGE_LOW_QUANTILE * PERCENTILE_SCALE);
const highPercentile = Math.round(
  DAMAGE_RANGE_HIGH_QUANTILE * PERCENTILE_SCALE,
);

const bandShare = DAMAGE_RANGE_HIGH_QUANTILE - DAMAGE_RANGE_LOW_QUANTILE;
const activationsInBandOutOfTen = Math.round(bandShare * OUT_OF_TEN);

export const TOOLTIP_KILL =
  'Chance this activation drops the target: P(total damage >= remaining HP) using the lines you actually picked. Each swing deals its picked damage when the roll reaches it, or the best lower column it does reach; each swing rolls its own dice pool. Guaranteed activated-trait damage is included, and the swings shown are assumed to happen.';

export const TOOLTIP_EXPECTED_DAMAGE =
  'Mean total damage across the activation using your picked lines (best lower column on an under-roll), plus guaranteed activated-trait damage.';

export const TOOLTIP_PLAN_FAILS =
  'Chance the plan does not fully come together: 1 - P(every selected swing reaches its picked wrap line). A swing with no picks always "succeeds". High here means your line relies on rolls that often whiff, even if expected damage looks fine.';

export const TOOLTIP_HP_LEFT =
  'Mean target HP remaining afterwards: average of max(0, HP - total damage) over every outcome. ~0 means a near-certain kill; a large number means you need another activation.';

export const TOOLTIP_DAMAGE_RANGE = `Likely total damage: the ${lowPercentile}th-${highPercentile}th percentile band. Roughly ${activationsInBandOutOfTen} in ${OUT_OF_TEN} activations land in this range, so a wide band means the result is swingy and a tight band means it is reliable.`;
