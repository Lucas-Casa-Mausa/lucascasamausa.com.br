import type { ActiveTier } from './tier';

/**
 * Liga os efeitos da página atual. Cada efeito devolve sua limpeza; a ordem de limpeza é a inversa.
 * `signal` cancela entre os imports: um start antigo não pode montar nada depois que a rota mudou.
 */
export async function startMotion(tier: ActiveTier, signal: AbortSignal): Promise<() => void> {
  const cleanups: (() => void)[] = [];
  const dispose = () => {
    for (const cleanup of cleanups.reverse()) cleanup();
    cleanups.length = 0;
  };
  const cancelled = () => {
    if (signal.aborted) dispose();
    return signal.aborted;
  };

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const { mountHeroPackets } = await import('@/features/hero/packets/mount');
    if (cancelled()) return () => {};
    cleanups.push(mountHeroPackets(hero, tier));
  }
  const { initScroll } = await import('./scroll');
  if (cancelled()) return () => {};
  cleanups.push(await initScroll());
  const { initReveal } = await import('@/features/plates/reveal');
  if (cancelled()) return () => {};
  cleanups.push(initReveal(tier));
  const { initExplode } = await import('@/features/plates/explode');
  if (cancelled()) return () => {};
  cleanups.push(initExplode(tier));
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  if (cancelled()) return () => {};
  ScrollTrigger.refresh();

  // O refresh do ScrollTrigger rola até 0 e restaura, o que interrompe a rolagem nativa até uma âncora (#contato).
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });

  return dispose;
}
