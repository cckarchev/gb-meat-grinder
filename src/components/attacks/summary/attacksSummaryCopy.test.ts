import { describe, expect, it } from 'vitest';
import { TOOLTIP_DAMAGE_RANGE } from '@/components/attacks/summary/attacksSummaryCopy';

describe('TOOLTIP_DAMAGE_RANGE', () => {
  it('describes the percentile band the summary computes', () => {
    expect(TOOLTIP_DAMAGE_RANGE).toBe(
      'Likely total damage: the 10th-90th percentile band. Roughly 8 in 10 activations land in this range, so a wide band means the result is swingy and a tight band means it is reliable.',
    );
  });
});
