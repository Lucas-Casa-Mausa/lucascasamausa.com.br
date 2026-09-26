import { describe, expect, it } from 'vitest';
import { staticFrame, VIEWBOX } from '@/features/agent/presence/static-frame';

const coords = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);

describe('quadro estático', () => {
  it('é determinístico', () => {
    expect(staticFrame('md')).toEqual(staticFrame('md'));
  });

  it('todas as coordenadas são finitas e ficam dentro do viewBox', () => {
    for (const detail of ['sm', 'md', 'lg'] as const) {
      const { paths, dots } = staticFrame(detail);
      expect(paths.length).toBeGreaterThan(0);
      for (const p of paths) {
        expect(p.d).not.toMatch(/NaN|Infinity/);
        for (const n of coords(p.d)) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(VIEWBOX);
        }
        expect(p.opacity).toBeGreaterThan(0);
        expect(p.opacity).toBeLessThanOrEqual(1);
      }
      for (const d of dots) for (const n of [d.cx, d.cy]) expect(n >= 0 && n <= VIEWBOX).toBe(true);
    }
  });

  it('mais detalhe, mais traço; o HTML das miniaturas fica pequeno', () => {
    const size = (d: 'sm' | 'md' | 'lg') => staticFrame(d).paths.reduce((n, p) => n + p.d.length, 0);
    expect(size('sm')).toBeLessThan(size('md'));
    expect(size('md')).toBeLessThan(size('lg'));
    expect(size('sm')).toBeLessThan(2500);
    expect(size('md')).toBeLessThan(6000);
  });
});
