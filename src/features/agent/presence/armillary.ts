import { HIST_LEN, type PresenceState } from './state';

export type Detail = 'sm' | 'md' | 'lg';

/** Segmento: x1,y1,z1,x2,y2,z2,alpha,flags. */
export const SEG_STRIDE = 8;
/** Ponto: x,y,z,alpha,flags,raio (px CSS). */
export const PT_STRIDE = 6;
/** Bits de flags: cor de osso; HUD (espaço de tela, sem rotação nem perspectiva). */
export const BONE = 1;
export const HUD = 2;

/** Escala de encaixe no canvas (a escala do HUD chega a r = 1,49 no lg/md). */
export const SCALE: Record<Detail, number> = { sm: 0.9, md: 0.66, lg: 0.64 };
export const PITCH = 0.35;

const MAX_SEGS = 1024;
const MAX_PTS = 16;
const TAU = Math.PI * 2;
const HUD_R = 1.2;

export type Geometry = { seg: Float32Array; segCount: number; pts: Float32Array; ptCount: number };

export function createGeometry(): Geometry {
  return { seg: new Float32Array(MAX_SEGS * SEG_STRIDE), segCount: 0, pts: new Float32Array(MAX_PTS * PT_STRIDE), ptCount: 0 };
}

type Vec = readonly [number, number, number];
const RINGS: readonly { r: number; ax: Vec; w: number; lock: Vec }[] = [
  { r: 1.0, ax: [0.2, 1, 0.1], w: 0.7, lock: [0, 1, 0] },
  { r: 0.93, ax: [1, 0.3, 0.2], w: -0.9, lock: [1, 0, 0] },
  { r: 0.86, ax: [0.3, 0.2, 1], w: 1.2, lock: [0, 0, 1] },
  { r: 0.58, ax: [0.7, 0.7, 0.2], w: -1.7, lock: [0, 1, 0] },
  { r: 0.52, ax: [-0.4, 0.6, 0.7], w: 2.1, lock: [1, 0, 0] },
];

const CONF: Record<Detail, { rings: number; segs: number; bead: number; core: number; ticks: number }> = {
  sm: { rings: 2, segs: 28, bead: 0, core: 0.3, ticks: 0 },
  md: { rings: 3, segs: 48, bead: 1.5, core: 0.22, ticks: 40 },
  lg: { rings: 5, segs: 96, bead: 2, core: 0.22, ticks: 120 },
};

const ICO = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  const raw: Vec[] = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
  const v = raw.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l] as Vec;
  });
  const e: [number, number][] = [];
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++)
      if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) < 1.1) e.push([i, j]);
  return { v, e };
})();

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function seg(g: Geometry, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, a: number, f: number) {
  if (g.segCount >= MAX_SEGS) return;
  const o = g.segCount++ * SEG_STRIDE;
  const d = g.seg;
  d[o] = x1; d[o + 1] = y1; d[o + 2] = z1; d[o + 3] = x2; d[o + 4] = y2; d[o + 5] = z2; d[o + 6] = a; d[o + 7] = f;
}

function pt(g: Geometry, x: number, y: number, z: number, a: number, f: number, r: number) {
  if (g.ptCount >= MAX_PTS) return;
  const o = g.ptCount++ * PT_STRIDE;
  const d = g.pts;
  d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = a; d[o + 4] = f; d[o + 5] = r;
}

/** Preenche `g` com a forma no estado `s`. Aloca só alguns vetores por anel, nunca por segmento. */
export function buildArmillary(s: PresenceState, detail: Detail, g: Geometry): void {
  g.segCount = 0;
  g.ptCount = 0;
  const c = CONF[detail];
  const { think, speak, energy, t, spin } = s;
  // Pensando: os eixos travam em x/y/z e soltam, num vaivém.
  const snap = think * smooth(0.15, 0.85, 0.5 + 0.5 * Math.sin(t * 1.4));

  for (let i = 0; i < c.rings; i++) {
    const ring = RINGS[i];
    const a = spin * ring.w;
    // Eixo que deriva: gira em X por a·0,6 e em Y por a; depois puxa para o eixo de trava.
    let [nx, ny, nz] = ring.ax;
    let cs = Math.cos(a * 0.6), sn = Math.sin(a * 0.6);
    [ny, nz] = [cs * ny - sn * nz, sn * ny + cs * nz];
    cs = Math.cos(a); sn = Math.sin(a);
    [nx, nz] = [cs * nx + sn * nz, -sn * nx + cs * nz];
    let l = Math.hypot(nx, ny, nz);
    nx = nx / l + (ring.lock[0] - nx / l) * snap;
    ny = ny / l + (ring.lock[1] - ny / l) * snap;
    nz = nz / l + (ring.lock[2] - nz / l) * snap;
    l = Math.hypot(nx, ny, nz);
    nx /= l; ny /= l; nz /= l;
    // Base (u, v) do plano do anel.
    const [hx, hy, hz] = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let ux = ny * hz - nz * hy, uy = nz * hx - nx * hz, uz = nx * hy - ny * hx;
    l = Math.hypot(ux, uy, uz);
    ux /= l; uy /= l; uz /= l;
    const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;

    const r = ring.r * (1 + energy * speak * (i >= 3 ? 0.2 : 0.04));
    const alpha = i >= 3 ? 0.6 : 0.85;
    let px = ux * r, py = uy * r, pz = uz * r;
    for (let k = 1; k <= c.segs; k++) {
      const ang = (k / c.segs) * TAU;
      const co = Math.cos(ang) * r, si = Math.sin(ang) * r;
      const x = ux * co + vx * si, y = uy * co + vy * si, z = uz * co + vz * si;
      seg(g, px, py, pz, x, y, z, alpha, 0);
      px = x; py = y; pz = z;
    }
    if (c.bead) {
      const b = spin * ring.w * 2.3;
      const co = Math.cos(b) * r, si = Math.sin(b) * r;
      pt(g, ux * co + vx * si, uy * co + vy * si, uz * co + vz * si, 1, BONE, c.bead);
    }
  }

  // Núcleo: icosaedro girando, cresce com a energia e fica cor de osso no pico da fala.
  const cr = c.core * (1 + energy * 0.7 * speak + 0.05 * Math.sin(t * 2.2));
  const ca = spin * 1.6;
  const cy = Math.cos(ca), sy = Math.sin(ca), cx = Math.cos(ca * 0.7), sx = Math.sin(ca * 0.7);
  const hot = energy * speak > 0.55 ? BONE : 0;
  const core = ICO.v.map(([x, y, z]) => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z; // rotY
    const y2 = cx * y - sx * z1, z2 = sx * y + cx * z1; // rotX
    return [x1 * cr, y2 * cr, z2 * cr] as Vec;
  });
  for (const [i, j] of ICO.e) seg(g, core[i][0], core[i][1], core[i][2], core[j][0], core[j][1], core[j][2], 0.95, hot);

  // Escala graduada (HUD): varredura no "pensando", forma de onda do histórico no "falando".
  if (c.ticks) {
    const n = c.ticks;
    const sweep = (t * 2.4) % TAU;
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * TAU;
      const ex = Math.sin(ang), ey = Math.cos(ang);
      const hv = Math.min(1, s.hist[Math.floor((Math.min(k, n - k) / (n / 2)) * (HIST_LEN - 1))]);
      let dg = Math.abs(ang - sweep);
      dg = Math.min(dg, TAU - dg);
      const scan = think * Math.exp(-dg * dg * 14);
      const len = (k % 10 === 0 ? 0.07 : 0.03) + hv * 0.22 * speak;
      const alpha = Math.min(1, 0.3 + scan * 0.7 + hv * 0.5 * speak);
      seg(g, ex * HUD_R, ey * HUD_R, 0, ex * (HUD_R + len), ey * (HUD_R + len), 0, alpha, HUD | (scan > 0.35 ? BONE : 0));
    }
  }
}
