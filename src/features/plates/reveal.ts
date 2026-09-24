import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ActiveTier } from '@/lib/motion/tier';

/** "Câmera entrando na prancheta" (§3) e o feixe que passa pela foto na entrada (§2.6). */
export function initReveal(tier: ActiveTier): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const ctx = gsap.context(() => {
    const work = document.querySelector<HTMLElement>('[data-reveal]');
    if (work) {
      const inset = tier === 'full' ? '6%' : '3%';
      gsap.fromTo(
        work,
        { clipPath: `inset(${inset} ${inset} 0% ${inset})` },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: work, start: 'top bottom', end: 'top 15%', scrub: true },
        },
      );
    }

    const sweep = document.querySelector<HTMLElement>('[data-photo-sweep]');
    if (sweep) {
      gsap.fromTo(
        sweep,
        { xPercent: -110, opacity: 1 },
        {
          xPercent: 330,
          duration: 1.1,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: sweep.parentElement, start: 'top 75%', once: true },
          onComplete: () => {
            sweep.dataset.swept = 'true';
            gsap.set(sweep, { opacity: 0 });
          },
        },
      );
    }
  });
  return () => ctx.revert();
}
