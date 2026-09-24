import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/** Scroll suave que só suaviza: roda no ticker do GSAP para o ScrollTrigger ficar em sincronia. */
export async function initScroll(): Promise<() => void> {
  gsap.registerPlugin(ScrollTrigger);
  // Sem forçar o topo: recarregar no meio da página preserva a posição; na troca de rota o Next já sobe.
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
