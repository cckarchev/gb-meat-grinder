import { describe, expect, it } from 'vitest';
import { attackKind, attackKindLabel } from '@/core/attacks/attackVariant';
import { makeAttacker } from '@/core/testing/fixtures';

const CHARGE_ROW = 0;
const BASE_ROW = 1;
const BERSERKER_ROW = 2;

describe('attack row kind', () => {
  const attacker = makeAttacker({ inf: 2, berserker: true });

  it('classifies Berserker, charge and base rows', () => {
    expect(attackKind(attacker, BERSERKER_ROW, CHARGE_ROW)).toBe('berserker');

    expect(attackKind(attacker, CHARGE_ROW, CHARGE_ROW)).toBe('charge');
    expect(attackKind(attacker, BASE_ROW, CHARGE_ROW)).toBe('base');
  });

  it('labels each kind for screen readers and headings', () => {
    expect(attackKindLabel(attacker, BERSERKER_ROW, CHARGE_ROW)).toBe(
      'Berserker attack',
    );

    expect(attackKindLabel(attacker, CHARGE_ROW, CHARGE_ROW)).toBe(
      'Charge attack',
    );

    expect(attackKindLabel(attacker, BASE_ROW, CHARGE_ROW)).toBe('Base attack');
  });
});
