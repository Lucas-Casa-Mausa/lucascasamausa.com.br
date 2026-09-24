import { describe, expect, it } from 'vitest';
import {
  createPackets,
  createRng,
  overlapOf,
  PACKET_COUNT,
  spawnPacket,
  stepPacket,
  type EngineConfig,
  type Packet,
} from '@/features/hero/packets/engine';

const cfg = (over: Partial<EngineConfig> = {}): EngineConfig => ({
  width: 1000,
  height: 400,
  count: 10,
  dpr: 1,
  rng: createRng(42),
  ...over,
});
const still = { x: 0, y: 0, active: false };
const empty = () => 0;

describe('engine dos pacotes', () => {
  it('quantidades por nível seguem a spec', () => {
    expect(PACKET_COUNT).toEqual({ full: 38, lite: 22 });
  });

  it('rng com a mesma semente repete a sequência', () => {
    const a = createRng(7), b = createRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('createPackets cria a quantidade pedida, dentro da área', () => {
    const ps = createPackets(cfg({ count: 22 }));
    expect(ps).toHaveLength(22);
    for (const p of ps) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(400);
    }
  });

  it('sem letras nem ponteiro, anda só para a direita', () => {
    const c = cfg();
    const p: Packet = { ...spawnPacket(c, 100), y: 200, vy: 0 };
    const x0 = p.x;
    stepPacket(p, empty, still, c);
    expect(p.x).toBeCloseTo(x0 + p.v);
    expect(p.y).toBe(200);
  });

  it('desvia para cima quando há letra logo abaixo', () => {
    const c = cfg();
    const p: Packet = { ...spawnPacket(c, 100), y: 200, vy: 0 };
    const letterBelow = (_x: number, y: number) => (y > 200 ? 1 : 0);
    stepPacket(p, letterBelow, still, c);
    expect(p.vy).toBeLessThan(0);
  });

  it('o ponteiro logo abaixo empurra o pacote para cima', () => {
    const c = cfg();
    const p: Packet = { ...spawnPacket(c, 300), y: 200, vy: 0, w: 100 };
    stepPacket(p, empty, { x: 250, y: 230, active: true }, c);
    expect(p.vy).toBeLessThan(0);
  });

  it('renasce à esquerda quando sai pela direita', () => {
    const c = cfg();
    const p: Packet = { ...spawnPacket(c, 0), x: 1000 + 500, w: 50 };
    stepPacket(p, empty, still, c);
    expect(p.x).toBeLessThanOrEqual(0);
  });

  it('overlapOf é a maior densidade sob o corpo do pacote', () => {
    const p: Packet = { x: 200, y: 50, w: 100, h: 6, v: 1, vy: 0, shift: 8 };
    const field = (x: number) => (x < 150 ? 0.7 : 0.1);
    expect(overlapOf(p, field)).toBeCloseTo(0.7);
  });
});
