import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ActiveTier } from '@/lib/motion/tier';

/**
 * A prancha entra "explodida" e se monta até o centro da tela, onde fica legível.
 * full: planos separados em Z com a prancha inclinada (isométrico). lite: 2,5D, só deslocamento vertical.
 */
export function initExplode(tier: ActiveTier): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const ctx = gsap.context(() => {
    for (const stack of gsap.utils.toArray<HTMLElement>('[data-explode]')) {
      const planes = Array.from(stack.querySelectorAll<SVGSVGElement>('[data-plane]'));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: stack, start: 'top bottom', end: 'center 55%', scrub: 0.6 },
      });
      if (tier === 'full') {
        tl.from(stack, { rotateX: 55, rotateZ: -30, scale: 0.85, ease: 'none' }, 0);
        for (const plane of planes) tl.from(plane, { z: Number(plane.dataset.plane) * 60, ease: 'none' }, 0);
      } else {
        for (const plane of planes) tl.from(plane, { y: -Number(plane.dataset.plane) * 16, ease: 'none' }, 0);
      }
    }
  });
  return () => ctx.revert();
}
