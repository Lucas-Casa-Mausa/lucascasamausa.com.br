export type Packet = { x: number; y: number; w: number; h: number; v: number; vy: number; shift: number };
export type Field = (x: number, y: number) => number;
export type Pointer = { x: number; y: number; active: boolean };
export type EngineConfig = { width: number; height: number; count: number; dpr: number; rng: () => number };

export const PACKET_COUNT = { full: 24, lite: 14 } as const;

/** mulberry32: determinístico, para testes reproduzíveis. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function spawnPacket(cfg: EngineConfig, x?: number): Packet {
  const { rng, dpr, height } = cfg;
  const h = (3 + rng() * 9) * dpr;
  return {
    x: x ?? -rng() * 300 * dpr,
    y: rng() * height,
    w: (40 + rng() * 150) * dpr,
    h,
    v: (1.2 + rng() * 2.8) * dpr,
    vy: 0,
    shift: (4 + rng() * 14) * dpr,
  };
}

export function createPackets(cfg: EngineConfig): Packet[] {
  return Array.from({ length: cfg.count }, () => spawnPacket(cfg, cfg.rng() * cfg.width));
}

/** Um passo: desvio das letras (olha à frente), desvio do ponteiro, avanço e renascimento. */
export function stepPacket(p: Packet, field: Field, pointer: Pointer, cfg: EngineConfig): void {
  const { dpr, width, height } = cfg;
  const ahead = p.x + 10 * dpr;
  const reach = p.h + 4 * dpr;
  const gradient = field(ahead, p.y + reach) - field(ahead, p.y - reach);
  p.vy += -gradient * 1.1 * dpr;

  if (pointer.active) {
    const dx = p.x - p.w / 2 - pointer.x;
    const dy = p.y - pointer.y;
    const radius = 110 * dpr;
    const d = Math.hypot(dx, dy);
    if (d < radius) p.vy += (dy / (d + 1)) * (1 - d / radius) * 2.4 * dpr;
  }

  p.vy *= 0.88;
  p.y += p.vy;
  p.x += p.v;

  if (p.x - p.w > width || p.y < -20 * dpr || p.y > height + 20 * dpr) Object.assign(p, spawnPacket(cfg));
}

export function overlapOf(p: Packet, field: Field): number {
  return Math.max(field(p.x - p.w * 0.25, p.y), field(p.x - p.w * 0.75, p.y));
}
