import { BONE, HUD, PT_STRIDE, SEG_STRIDE, type Geometry } from './armillary';

export type View = { yaw: number; pitch: number; width: number; height: number; scale: number };

/** Níveis de opacidade por cor: cada lote vira um único stroke(). */
export const BUCKETS = 8;
/** Saída por segmento: x1,y1,x2,y2 (px do canvas) e o lote. */
export const OUT_STRIDE = 5;
/** Saída por ponto: x,y,alpha,osso (0|1),raio (px CSS × perspectiva). */
export const PT_OUT_STRIDE = 5;

const DIST = 5;
const FAR_ALPHA = 0.16;

export type Projected = { seg: Float32Array; segCount: number; pts: Float32Array; ptCount: number };

export function createProjected(): Projected {
  return { seg: new Float32Array(1024 * OUT_STRIDE), segCount: 0, pts: new Float32Array(16 * PT_OUT_STRIDE), ptCount: 0 };
}

export const bucketOf = (alpha: number, bone: boolean) =>
  (bone ? BUCKETS : 0) + Math.min(BUCKETS - 1, Math.max(0, Math.floor(alpha * BUCKETS)));
export const bucketAlpha = (bucket: number) => ((bucket % BUCKETS) + 0.5) / BUCKETS;

// Rascunho reaproveitado: [x de tela, y de tela, fator de opacidade, fator de perspectiva].
const P = new Float32Array(4);

export function project(g: Geometry, v: View, out: Projected): void {
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
  // Linhas de R = Rx(pitch)·Ry(yaw).
  const r00 = cy, r02 = sy;
  const r10 = sp * sy, r11 = cp, r12 = -sp * cy;
  const r20 = -cp * sy, r21 = sp, r22 = cp * cy;
  const half = (Math.min(v.width, v.height) / 2) * v.scale;
  const ox = v.width / 2, oy = v.height / 2;

  const tf = (x: number, y: number, z: number, hud: boolean) => {
    if (hud) {
      P[0] = ox + x * half; P[1] = oy - y * half; P[2] = 1; P[3] = 1;
      return;
    }
    const qx = r00 * x + r02 * z;
    const qy = r10 * x + r11 * y + r12 * z;
    const qz = r20 * x + r21 * y + r22 * z;
    const w = DIST / (DIST + qz);
    const depth = Math.min(1, Math.max(0, (qz + 1) / 2));
    P[0] = ox + qx * w * half; P[1] = oy - qy * w * half; P[2] = 1 + (FAR_ALPHA - 1) * depth; P[3] = w;
  };

  const s = g.seg, o = out.seg;
  for (let i = 0; i < g.segCount; i++) {
    const a = i * SEG_STRIDE, b = i * OUT_STRIDE;
    const flags = s[a + 7], hud = (flags & HUD) !== 0;
    tf(s[a], s[a + 1], s[a + 2], hud);
    o[b] = P[0]; o[b + 1] = P[1];
    const f1 = P[2];
    tf(s[a + 3], s[a + 4], s[a + 5], hud);
    o[b + 2] = P[0]; o[b + 3] = P[1];
    o[b + 4] = bucketOf((s[a + 6] * (f1 + P[2])) / 2, (flags & BONE) !== 0);
  }
  out.segCount = g.segCount;

  const p = g.pts, q = out.pts;
  for (let i = 0; i < g.ptCount; i++) {
    const a = i * PT_STRIDE, b = i * PT_OUT_STRIDE;
    tf(p[a], p[a + 1], p[a + 2], (p[a + 4] & HUD) !== 0);
    q[b] = P[0]; q[b + 1] = P[1]; q[b + 2] = p[a + 3] * P[2]; q[b + 3] = p[a + 4] & BONE ? 1 : 0; q[b + 4] = p[a + 5] * P[3];
  }
  out.ptCount = g.ptCount;
}
