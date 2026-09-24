import type { ActiveTier } from './tier';

/** Liga os efeitos da página atual. Cada efeito devolve sua limpeza; a ordem de limpeza é a inversa. */
export async function startMotion(tier: ActiveTier): Promise<() => void> {
  const cleanups: (() => void)[] = [];
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const { mountHeroPackets } = await import('@/features/hero/packets/mount');
    cleanups.push(mountHeroPackets(hero, tier));
  }
  const { initScroll } = await import('./scroll');
  cleanups.push(await initScroll());
  const { initReveal } = await import('@/features/plates/reveal');
  cleanups.push(initReveal(tier));
  const { initExplode } = await import('@/features/plates/explode');
  cleanups.push(initExplode(tier));
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  ScrollTrigger.refresh();
  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
