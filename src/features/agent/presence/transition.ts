export const OPEN_MS = 750;
export const CLOSE_MS = 550;
export const NO_ORIGIN_MS = 500;
export const REDUCED_MS = 150;
export const FADE_OUT_MS = 200;
const EASE = 'cubic-bezier(.2,.8,.2,1)';

export type TransitionParts = {
  root: HTMLElement;
  fades: HTMLElement[];
  target: HTMLElement | null;
  origin: HTMLElement | null;
  reduced: boolean;
};

const flip = (from: DOMRect, to: DOMRect) =>
  `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${from.width / Math.max(1, to.width)})`;

const inView = (r: DOMRect | undefined): r is DOMRect =>
  !!r && r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;

/** Esconde a miniatura de origem enquanto o overlay existe (a forma "saiu" dela); devolve a restauração. */
export function hideOrigin(origin: HTMLElement): () => void {
  origin.style.visibility = 'hidden';
  return () => {
    origin.style.visibility = '';
  };
}

/** A forma sai da miniatura de origem e cresce até o lugar dela; o fundo e o conteúdo entram com fade. */
export function animateOpen({ root, fades, target, origin, reduced }: TransitionParts): void {
  if (reduced) {
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, easing: 'ease-out' });
    return;
  }
  const bg = getComputedStyle(root).backgroundColor;
  root.animate([{ backgroundColor: 'transparent' }, { backgroundColor: bg }], { duration: OPEN_MS / 2, easing: 'ease-out' });
  for (const el of fades) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: OPEN_MS * 0.6, easing: 'ease-out', fill: 'backwards' });
  if (!target) return;
  const from = origin?.getBoundingClientRect();
  if (inView(from)) target.animate([{ transform: flip(from, target.getBoundingClientRect()) }, { transform: 'none' }], { duration: OPEN_MS, easing: EASE });
  else target.animate([{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: NO_ORIGIN_MS, easing: EASE });
}

/** O caminho de volta. Resolve quando termina (ou falha): quem chama só desmonta depois. */
export function animateClose({ root, fades, target, origin, reduced }: TransitionParts): Promise<void> {
  const anims: Animation[] = [];
  const from = origin?.getBoundingClientRect();
  if (reduced) {
    anims.push(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, fill: 'forwards' }));
  } else if (target && inView(from)) {
    const bg = getComputedStyle(root).backgroundColor;
    for (const el of fades) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    anims.push(target.animate([{ transform: 'none' }, { transform: flip(from, target.getBoundingClientRect()) }], { duration: CLOSE_MS, easing: EASE, fill: 'forwards' }));
    anims.push(root.animate([{ backgroundColor: bg }, { backgroundColor: 'transparent' }], { duration: CLOSE_MS, delay: CLOSE_MS * 0.3, fill: 'forwards' }));
  } else {
    anims.push(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, fill: 'forwards' }));
  }
  return Promise.all(anims.map((a) => a.finished)).then(
    () => undefined,
    () => undefined,
  );
}
