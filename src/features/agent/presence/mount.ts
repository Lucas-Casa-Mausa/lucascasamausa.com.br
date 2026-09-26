import type { ActiveTier } from '@/lib/motion/tier';
import { buildArmillary, createGeometry, PITCH, SCALE, type Detail } from './armillary';
import { createRenderer } from './render';
import { createPresenceState, pulse as pulseState, setPresence, step, type PresenceName } from './state';

export type PresenceHandle = { setState: (n: PresenceName) => void; pulse: (amp: number) => void; dispose: () => void };

const NOOP: PresenceHandle = { setState() {}, pulse() {}, dispose() {} };
const LINE: Record<Detail, number> = { sm: 1.2, md: 1, lg: 1 };
const clamp1 = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Monta o canvas animado sobre o SVG do host. O loop só roda com o host na tela e a aba visível.
 * Qualquer erro no quadro desmonta o canvas e devolve o SVG: a animação nunca quebra a página.
 */
export function mountPresence(host: HTMLElement, opts: { detail: Detail; idleFps: number; followPointer: boolean }): PresenceHandle {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return NOOP;

  const svg = host.querySelector<SVGElement>('[data-presence-svg]');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.presenceCanvas = '';
  canvas.className = 'pointer-events-none absolute inset-0 size-full';
  host.appendChild(canvas);

  const draw = createRenderer(ctx);
  const s = createPresenceState(Math.random() * Math.PI * 2);
  const g = createGeometry();
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let onScreen = false;
  let raf = 0;
  let lastDraw = 0;
  let disposed = false;
  host.dataset.state = 'idle';
  host.dataset.running = 'false';

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !onScreen || document.hidden) {
      host.dataset.running = 'false';
      lastDraw = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
    // Em repouso a forma se move devagar: meia taxa de quadros poupa bateria.
    const minGap = s.name === 'idle' ? 1000 / opts.idleFps - 2 : 0;
    if (lastDraw && now - lastDraw < minGap) return;
    const dt = lastDraw ? Math.min(0.05, (now - lastDraw) / 1000) : 0;
    lastDraw = now;
    try {
      step(s, dt);
      const k = 1 - Math.exp(-dt * 4);
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      buildArmillary(s, opts.detail, g);
      draw(g, { yaw: s.yaw + ptr.x * 0.45, pitch: PITCH + ptr.y * 0.3, width: w, height: h, scale: SCALE[opts.detail] }, dpr, LINE[opts.detail]);
      if (host.dataset.running !== 'true') {
        host.dataset.running = 'true';
        if (svg) svg.style.visibility = 'hidden';
      }
    } catch {
      dispose();
    }
  };

  const kick = () => {
    if (!raf && !disposed && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    kick();
  });
  io.observe(host);
  document.addEventListener('visibilitychange', kick);
  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    ptr.tx = clamp1((e.clientX - r.left - r.width / 2) / r.width);
    ptr.ty = clamp1((e.clientY - r.top - r.height / 2) / r.height);
  };
  if (opts.followPointer) window.addEventListener('pointermove', onPointer, { passive: true });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener('visibilitychange', kick);
    window.removeEventListener('pointermove', onPointer);
    canvas.remove();
    if (svg) svg.style.visibility = '';
    host.dataset.running = 'false';
  }

  return {
    setState(n) {
      setPresence(s, n);
      host.dataset.state = n;
      kick();
    },
    pulse(amp) {
      pulseState(s, amp);
    },
    dispose,
  };
}

/** Miniatura da nav ou do prompt: detalhe pelo nível, "ouvindo" no hover/foco, pulso por tecla no prompt. */
export function mountMini(host: HTMLElement, tier: ActiveTier): () => void {
  const kind = host.dataset.agentPresence;
  const detail: Detail = kind === 'prompt' && tier === 'full' ? 'md' : 'sm';
  const handle = mountPresence(host, { detail, idleFps: 30, followPointer: false });
  const zone = kind === 'prompt' ? host.closest('form') : host.closest('a');
  const input = kind === 'prompt' ? zone?.querySelector<HTMLInputElement>('input[name="q"]') : null;
  let hover = false;
  let focus = false;
  const sync = () => handle.setState(hover || focus ? 'listening' : 'idle');
  const enter = () => {
    hover = true;
    sync();
  };
  const leave = () => {
    hover = false;
    sync();
  };
  const focusIn = () => {
    focus = true;
    sync();
  };
  const focusOut = () => {
    focus = false;
    sync();
  };
  const key = (e: KeyboardEvent) => {
    if (e.key.length === 1 || e.key === 'Backspace') handle.pulse(0.7);
  };
  zone?.addEventListener('pointerenter', enter);
  zone?.addEventListener('pointerleave', leave);
  input?.addEventListener('focus', focusIn);
  input?.addEventListener('blur', focusOut);
  input?.addEventListener('keydown', key);
  return () => {
    zone?.removeEventListener('pointerenter', enter);
    zone?.removeEventListener('pointerleave', leave);
    input?.removeEventListener('focus', focusIn);
    input?.removeEventListener('blur', focusOut);
    input?.removeEventListener('keydown', key);
    handle.dispose();
  };
}
