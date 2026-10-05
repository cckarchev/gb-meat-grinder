/** Whether `index` points at a real attack row rather than `NO_ATTACK_INDEX`. */
export const isAttackIndex = (index: number): boolean => {
  return index >= 0;
};
