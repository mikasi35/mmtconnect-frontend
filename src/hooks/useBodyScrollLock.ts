import { useEffect } from 'react';

let locks = 0;

/**
 * Lock <body> scroll while `active` is true. Ref-counted so nested
 * modals / sheets don't unlock each other prematurely.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = '';
    };
  }, [active]);
}
