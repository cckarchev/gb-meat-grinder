/** HP left once `damage` lands on a target with `hp`, never below zero. */
export const hpAfterDamage = (hp: number, damage: number): number => {
  return Math.max(0, hp - damage);
};
