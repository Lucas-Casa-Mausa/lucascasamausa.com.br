import { describe, expect, it } from 'vitest';
import { createGeometry, HUD, SEG_STRIDE, type Geometry } from '@/features/agent/presence/armillary';
import { BUCKETS, bucketAlpha, bucketOf, createProjected, OUT_STRIDE, project } from '@/features/agent/presence/project';

const one = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, a: number, f: number): Geometry => {
  const g = createGeometry();
  g.seg.set([x1, y1, z1, x2, y2, z2, a, f], 0);
  g.segCount = 1;
  return g;
};
const view = { yaw: 0, pitch: 0, width: 200, height: 200, scale: 1 };

describe('projeção', () => {
  it('a origem vai para o centro do canvas', () => {
    const out = createProjected();
    project(one(0, 0, 0, 0, 0, 0, 1, 0), view, out);
    expect(Array.from(out.seg.subarray(0, 4))).toEqual([100, 100, 100, 100]);
  });

  it('HUD ignora a rotação e a perspectiva', () => {
    const a = createProjected();
    const b = createProjected();
    const g = one(1.2, 0, 0, 1.3, 0, 0, 1, HUD);
    project(g, view, a);
    project(g, { ...view, yaw: 1.3, pitch: 0.4 }, b);
    expect(Array.from(a.seg.subarray(0, 4))).toEqual(Array.from(b.seg.subarray(0, 4)));
    expect(a.seg[0]).toBeCloseTo(100 + 1.2 * 100, 3);
  });

  it('y do objeto para cima vira y de tela para baixo', () => {
    const out = createProjected();
    project(one(0, 0.5, 0, 0, 0.5, 0, 1, 0), view, out);
    expect(out.seg[1]).toBeLessThan(100);
  });

  it('o que está atrás (z > 0) fica mais apagado que o da frente', () => {
    const near = createProjected();
    const far = createProjected();
    project(one(0, 0, -1, 0.1, 0, -1, 1, 0), view, near);
    project(one(0, 0, 1, 0.1, 0, 1, 1, 0), view, far);
    expect(bucketAlpha(far.seg[4])).toBeLessThan(bucketAlpha(near.seg[4]));
  });

  it('lotes: âmbar em [0, 8), osso em [8, 16), opacidade no meio do degrau', () => {
    expect(bucketOf(1, false)).toBe(BUCKETS - 1);
    expect(bucketOf(0, false)).toBe(0);
    expect(bucketOf(1, true)).toBe(2 * BUCKETS - 1);
    expect(bucketAlpha(0)).toBeCloseTo(0.5 / BUCKETS, 6);
    expect(bucketAlpha(BUCKETS + 3)).toBeCloseTo(3.5 / BUCKETS, 6);
  });

  it('respeita segCount e o passo de saída', () => {
    const out = createProjected();
    const g = one(0, 0, 0, 1, 0, 0, 1, 0);
    project(g, view, out);
    expect(out.segCount).toBe(1);
    expect(OUT_STRIDE).toBe(5);
    expect(SEG_STRIDE).toBe(8);
  });
});
