'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { parseMotionOverride, readCapabilities, resolveTier } from './tier';

// Restauração de rolagem no voltar/avançar: o revert do ScrollTrigger rola até 0 e cancela a restauração
// nativa do navegador. Guardamos a posição de cada página ao sair e a reaplicamos quando se volta a ela.
const positions = new Map<string, number>();
let restoreKey: string | null = null;
if (typeof window !== 'undefined') {
  const here = () => window.location.pathname + window.location.search;
  // Captura no clique (fase de captura), antes de a navegação levar a página ao topo.
  document.addEventListener(
    'click',
    (e) => {
      if (e.target instanceof Element && e.target.closest('a[href]')) positions.set(here(), window.scrollY);
    },
    true,
  );
  window.addEventListener('popstate', () => {
    restoreKey = here();
  });
}

/** Decide o nível e, depois do load + ocioso, carrega os efeitos. Nada de movimento entra no JS inicial. */
export function MotionBoot() {
  const pathname = usePathname();

  useEffect(() => {
    const key = window.location.pathname + window.location.search;
    if (restoreKey === key) {
      restoreKey = null;
      const y = positions.get(key);
      if (y !== undefined) window.scrollTo({ top: y, behavior: 'instant' });
    }

    const tier = parseMotionOverride(window.location.search) ?? resolveTier(readCapabilities());
    document.documentElement.dataset.tier = tier;
    if (tier === 'static') return;

    const controller = new AbortController();
    let cleanup: (() => void) | undefined;
    let idleId: number | undefined;

    const start = async () => {
      const { startMotion } = await import('./start');
      const dispose = await startMotion(tier, controller.signal);
      if (controller.signal.aborted) dispose();
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
      controller.abort();
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
