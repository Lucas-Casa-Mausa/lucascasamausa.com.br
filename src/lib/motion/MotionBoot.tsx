'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { parseMotionOverride, readCapabilities, resolveTier } from './tier';

/** Decide o nível e, depois do load + ocioso, carrega os efeitos. Nada de movimento entra no JS inicial. */
export function MotionBoot() {
  const pathname = usePathname();

  useEffect(() => {
    const tier = parseMotionOverride(window.location.search) ?? resolveTier(readCapabilities());
    document.documentElement.dataset.tier = tier;
    if (tier === 'static') return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let idleId: number | undefined;

    const start = async () => {
      const { startMotion } = await import('./start');
      const dispose = await startMotion(tier);
      if (cancelled) dispose();
      else cleanup = dispose;
    };
    const schedule = () => {
      idleId =
        'requestIdleCallback' in window
          ? window.requestIdleCallback(() => void start(), { timeout: 2000 })
          : setTimeout(() => void start(), 200) as unknown as number;
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId !== undefined) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
