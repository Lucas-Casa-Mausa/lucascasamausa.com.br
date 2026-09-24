import { describe, expect, it } from 'vitest';
import { parseMotionOverride, resolveTier } from '@/lib/motion/tier';

const desktop = { reducedMotion: false, coarsePointer: false, width: 1440, deviceMemory: 8, cores: 8, saveData: false };

describe('resolveTier', () => {
  it('desktop capaz é full', () => {
    expect(resolveTier(desktop)).toBe('full');
  });

  it('movimento reduzido é static, em qualquer aparelho', () => {
    expect(resolveTier({ ...desktop, reducedMotion: true })).toBe('static');
  });

  it('economia de dados é static', () => {
    expect(resolveTier({ ...desktop, saveData: true })).toBe('static');
  });

  it('ponteiro grosso (toque) é lite', () => {
    expect(resolveTier({ ...desktop, coarsePointer: true, width: 412 })).toBe('lite');
  });

  it('tela estreita com mouse também é lite', () => {
    expect(resolveTier({ ...desktop, width: 700 })).toBe('lite');
  });

  it('aparelho fraco é static', () => {
    expect(resolveTier({ ...desktop, deviceMemory: 1 })).toBe('static');
    expect(resolveTier({ ...desktop, coarsePointer: true, width: 390, cores: 2 })).toBe('static');
  });

  it('sem deviceMemory/cores (Safari/Firefox) decide pelo resto', () => {
    expect(resolveTier({ reducedMotion: false, coarsePointer: false, width: 1280 })).toBe('full');
  });
});

describe('parseMotionOverride', () => {
  it('aceita ?motion=full|lite|static', () => {
    expect(parseMotionOverride('?motion=static')).toBe('static');
    expect(parseMotionOverride('?a=1&motion=lite')).toBe('lite');
    expect(parseMotionOverride('?motion=full')).toBe('full');
  });

  it('ignora ausente ou inválido', () => {
    expect(parseMotionOverride('')).toBeNull();
    expect(parseMotionOverride('?motion=turbo')).toBeNull();
  });
});
