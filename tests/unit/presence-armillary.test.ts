import { describe, expect, it } from 'vitest';
import { BONE, buildArmillary, createGeometry, HUD, PT_STRIDE, SEG_STRIDE, type Detail } from '@/features/agent/presence/armillary';
import { createPresenceState, pulse, setPresence, step, type PresenceName } from '@/features/agent/presence/state';

const build = (detail: Detail) => {
  const g = createGeometry();
  buildArmillary(createPresenceState(), detail, g);
  return g;
};

describe('geometria armilar', () => {
  it('contagens exatas por detalhe: anéis + 30 arestas do icosaedro + marcas da escala', () => {
    expect(build('sm').segCount).toBe(2 * 28 + 30);
    expect(build('md').segCount).toBe(3 * 48 + 30 + 40);
    expect(build('lg').segCount).toBe(5 * 96 + 30 + 120);
    expect(build('sm').ptCount).toBe(0);
    expect(build('md').ptCount).toBe(3);
    expect(build('lg').ptCount).toBe(5);
  });

  it('reusar o buffer não acumula segmentos', () => {
    const g = createGeometry();
    const s = createPresenceState();
    buildArmillary(s, 'lg', g);
    buildArmillary(s, 'lg', g);
    expect(g.segCount).toBe(5 * 96 + 30 + 120);
  });

  it('valores finitos e dentro dos limites em todos os estados, com energia no teto', () => {
    const states: PresenceName[] = ['idle', 'listening', 'thinking', 'speaking'];
    for (const detail of ['sm', 'md', 'lg'] as const) {
      for (const name of states) {
        const s = createPresenceState(1);
        setPresence(s, name);
        for (let i = 0; i < 120; i++) {
          pulse(s, 1);
          step(s, 1 / 60);
        }
        const g = createGeometry();
        buildArmillary(s, detail, g);
        for (let i = 0; i < g.segCount; i++) {
          const o = i * SEG_STRIDE;
          const v = Array.from(g.seg.subarray(o, o + SEG_STRIDE));
          expect(v.every(Number.isFinite), `${detail}/${name} seg ${i}`).toBe(true);
          const [x1, y1, z1, x2, y2, z2, a, f] = v;
          expect(a).toBeGreaterThanOrEqual(0);
          expect(a).toBeLessThanOrEqual(1);
          if (f & HUD) {
            expect(Math.hypot(x1, y1)).toBeLessThanOrEqual(1.5);
            expect(Math.hypot(x2, y2)).toBeLessThanOrEqual(1.5);
            expect(z1).toBe(0);
          } else {
            expect(Math.hypot(x1, y1, z1)).toBeLessThanOrEqual(1.3);
            expect(Math.hypot(x2, y2, z2)).toBeLessThanOrEqual(1.3);
          }
        }
        for (let i = 0; i < g.ptCount; i++) {
          const o = i * PT_STRIDE;
          expect(Array.from(g.pts.subarray(o, o + PT_STRIDE)).every(Number.isFinite)).toBe(true);
        }
      }
    }
  });

  it('falando com energia alta o núcleo fica cor de osso; em repouso fica âmbar', () => {
    const coreFlags = (s: ReturnType<typeof createPresenceState>) => {
      const g = createGeometry();
      buildArmillary(s, 'md', g);
      // Os 30 segmentos do núcleo vêm logo depois dos anéis.
      return g.seg[3 * 48 * SEG_STRIDE + 7];
    };
    const idle = createPresenceState();
    expect(coreFlags(idle) & BONE).toBe(0);
    const talking = createPresenceState();
    setPresence(talking, 'speaking');
    for (let i = 0; i < 180; i++) step(talking, 1 / 60);
    pulse(talking, 1);
    pulse(talking, 1);
    expect(coreFlags(talking) & BONE).toBe(BONE);
  });
});
