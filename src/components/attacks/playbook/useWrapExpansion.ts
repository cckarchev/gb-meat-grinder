import { useState } from 'react';

/** Which swings have their wrap continuation expanded, by attack index. */
export const useWrapExpansion = () => {
  const [expanded, setExpanded] = useState(() => new Set<number>());

  const toggle = (attackIndex: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(attackIndex)) {
        next.delete(attackIndex);
      } else {
        next.add(attackIndex);
      }

      return next;
    });
  };

  const isOpen = (attackIndex: number): boolean => {
    return expanded.has(attackIndex);
  };

  return { isOpen, toggle };
};
