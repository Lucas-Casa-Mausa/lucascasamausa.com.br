import type { ActiveTier } from '@/lib/motion/tier';
import { createPackets, createRng, overlapOf, PACKET_COUNT, stepPacket, type EngineConfig, type Field, type Packet, type Pointer } from './engine';
import { buildDensityField, drawPacket, drawSlice, measureNameLayout, paintName, type NameLayers } from './render';

const COLORS = { bone: '#efe9dc', amber: '#ffb000', grey: '#8c867a' } as const;

export function mountHeroPackets(hero: HTMLElement, tier: ActiveTier): () => void {
  const name = hero.querySelector<HTMLElement>('[data-hero-name]');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!name || !ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.heroCanvas = '';
  canvas.dataset.running = 'false';
  canvas.className = 'pointer-events-none absolute inset-x-0 z-10 w-full';
  hero.appendChild(canvas);

  const layers: NameLayers = {
    bone: document.createElement('canvas'),
    amber: document.createElement('canvas'),
    grey: document.createElement('canvas'),
  };
  const pointer: Pointer = { x: 0, y: 0, active: false };
  const rng = createRng(Date.now() >>> 0);
  let cfg: EngineConfig = { width: 1, height: 1, count: PACKET_COUNT[tier], dpr, rng };
  let packets: Packet[] = [];
  let field: Field = () => 0;
  let aligned = false;
  let visible = false;
  let raf = 0;
  let disposed = false;

  const layout = () => {
    const pad = name.offsetHeight * 0.25;
    canvas.style.top = `${name.offsetTop - pad}px`;
    canvas.style.height = `${name.offsetHeight + pad * 2}px`;
    const box = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(box.width * dpr));
    const height = Math.max(1, Math.round(box.height * dpr));
    for (const c of [canvas, layers.bone, layers.amber, layers.grey]) {
      c.width = width;
      c.height = height;
    }
    const measureCtx = layers.bone.getContext('2d');
    const nameLayout = measureCtx ? measureNameLayout(name, box, dpr, measureCtx) : null;
    aligned = nameLayout !== null;
    if (nameLayout) {
      for (const key of ['bone', 'amber', 'grey'] as const) {
        const layerCtx = layers[key].getContext('2d');
        if (layerCtx) paintName(layerCtx, nameLayout, COLORS[key]);
      }
      field = buildDensityField(layers.bone, 4);
      name.dataset.canvasName = 'on';
    } else {
      field = () => 0;
      delete name.dataset.canvasName;
    }
    cfg = { width, height, count: PACKET_COUNT[tier], dpr, rng };
    packets = createPackets(cfg);
  };

  const frame = () => {
    ctx.clearRect(0, 0, cfg.width, cfg.height);
    if (aligned) ctx.drawImage(layers.bone, 0, 0);
    for (const p of packets) {
      stepPacket(p, field, pointer, cfg);
      if (aligned) {
        const over = overlapOf(p, field);
        if (over > 0.08) drawSlice(ctx, layers, p, over, cfg.width);
      }
      drawPacket(ctx, p, dpr);
    }
    raf = requestAnimationFrame(frame);
  };
  const setRunning = (running: boolean) => {
    canvas.dataset.running = String(running);
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(frame);
  };

  const onPointerMove = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - box.left) * dpr;
    pointer.y = (e.clientY - box.top) * dpr;
    pointer.active = true;
  };
  const onPointerLeave = () => {
    pointer.active = false;
  };
  const onVisibility = () => setRunning(visible && document.visibilityState === 'visible');

  let resizeRaf = 0;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layout);
  });
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    onVisibility();
  });

  document.fonts.ready.then(() => {
    if (disposed) return;
    layout();
    resizeObserver.observe(hero);
    intersection.observe(hero);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
  });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(resizeRaf);
    resizeObserver.disconnect();
    intersection.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    delete name.dataset.canvasName;
    canvas.remove();
  };
}
