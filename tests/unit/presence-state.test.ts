import { describe, expect, it } from 'vitest';
import { createPresenceState, HIST_LEN, MAX_ENERGY, pulse, setPresence, step, type PresenceState } from '@/features/agent/presence/state';

const run = (s: PresenceState, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) step(s, 1 / 60);
};

describe('estado da presença', () => {
  it('converge para os alvos de cada estado', () => {
    const s = createPresenceState();
    setPresence(s, 'thinking');
    run(s, 3);
    expect(s.think).toBeCloseTo(1, 2);
    expect(s.speak).toBeCloseTo(0, 2);
    setPresence(s, 'speaking');
    run(s, 3);
    expect(s.think).toBeCloseTo(0.15, 2);
    expect(s.speak).toBeCloseTo(1, 2);
    setPresence(s, 'listening');
    run(s, 3);
    expect(s.think).toBeCloseTo(0.2, 2);
    expect(s.speak).toBeCloseTo(0.7, 2);
    setPresence(s, 'idle');
    run(s, 3);
    expect(s.think).toBeCloseTo(0, 2);
    expect(s.speak).toBeCloseTo(0, 2);
  });

  it('dt zero, negativo ou NaN não muda nada', () => {
    const s = createPresenceState();
    setPresence(s, 'thinking');
    pulse(s, 1);
    const before = structuredClone(s);
    step(s, 0);
    step(s, -1);
    step(s, Number.NaN);
    expect(s).toEqual(before);
  });

  it('pulso respeita o teto e ignora amplitude negativa', () => {
    const s = createPresenceState();
    for (let i = 0; i < 20; i++) pulse(s, 1);
    expect(s.energy).toBe(MAX_ENERGY);
    pulse(s, -5);
    expect(s.energy).toBe(MAX_ENERGY);
  });

  it('energia decai e o histórico guarda a amostra mais recente na frente', () => {
    const s = createPresenceState();
    pulse(s, 1);
    const e0 = s.energy;
    step(s, 1 / 45 + 1e-6);
    expect(s.energy).toBeLessThan(e0);
    expect(s.hist[0]).toBeCloseTo(s.energy, 5);
    run(s, 2);
    expect(s.hist[0]).toBeLessThan(0.01);
    expect(s.hist).toHaveLength(HIST_LEN);
  });

  it('trocar de estado muda a velocidade, não a posição (sem salto)', () => {
    const s = createPresenceState();
    run(s, 1);
    const spin = s.spin;
    const yaw = s.yaw;
    setPresence(s, 'thinking');
    step(s, 1 / 60);
    expect(s.spin - spin).toBeLessThan(0.05);
    expect(s.yaw - yaw).toBeLessThan(0.05);
  });
});
