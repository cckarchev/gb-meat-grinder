import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

/**
 * Open state for a hover / focus tooltip. It opens on hover or focus and closes
 * on leave, blur, Escape, or a click outside the wrapper. Spread `wrapperProps`
 * on the `position: relative` element holding trigger and bubble, and
 * `triggerProps` on the focusable trigger.
 */
export const useTooltipOpen = <TWrapper extends HTMLElement>() => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<TWrapper>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const wrapperProps = {
    ref: wrapperRef,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
  };

  const triggerProps = {
    'aria-describedby': open ? tooltipId : undefined,
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    },
  };

  const toggle = () => {
    setOpen((wasOpen) => !wasOpen);
  };

  return { open, tooltipId, toggle, wrapperProps, triggerProps };
};
