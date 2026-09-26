import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { mountPresence, type PresenceHandle } from './mount';
import type { PresenceName } from './state';

/**
 * Monta a presença no host visível (stage no desktop, cabeçalho no celular) e remonta ao cruzar o breakpoint.
 * No nível static não monta nada: fica o SVG do PresenceMark.
 */
export function usePresence(stage: RefObject<HTMLElement | null>, header: RefObject<HTMLElement | null>) {
  const handle = useRef<PresenceHandle | null>(null);
  const current = useRef<PresenceName>('idle');

  useEffect(() => {
    const tier = document.documentElement.dataset.tier;
    if (tier !== 'full' && tier !== 'lite') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const mount = () => {
      handle.current?.dispose();
      handle.current = null;
      const desktop = mq.matches;
      const host = desktop ? stage.current : header.current;
      if (!host) return;
      const detail = desktop ? (tier === 'full' ? 'lg' : 'md') : tier === 'full' ? 'md' : 'sm';
      handle.current = mountPresence(host, { detail, idleFps: 60, followPointer: desktop });
      handle.current.setState(current.current);
    };
    mount();
    mq.addEventListener('change', mount);
    return () => {
      mq.removeEventListener('change', mount);
      handle.current?.dispose();
      handle.current = null;
    };
  }, [stage, header]);

  return useMemo(
    () => ({
      setState(n: PresenceName) {
        current.current = n;
        handle.current?.setState(n);
      },
      pulse(amp: number) {
        handle.current?.pulse(amp);
      },
    }),
    [],
  );
}
