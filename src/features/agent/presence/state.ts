export type PresenceName = 'idle' | 'listening' | 'thinking' | 'speaking';

export const HIST_LEN = 64;
const HIST_DT = 1 / 45;
export const MAX_ENERGY = 1.4;

/** Alvos contínuos [pensar, falar] de cada estado. */
const TARGETS: Record<PresenceName, readonly [number, number]> = {
  idle: [0, 0],
  listening: [0.2, 0.7],
  thinking: [1, 0],
  speaking: [0.15, 1],
};

export type PresenceState = {
  name: PresenceName;
  t: number;
  think: number;
  speak: number;
  energy: number;
  /** Energia amostrada a 45 Hz; [0] é a mais recente. Vira a forma de onda da escala. */
  hist: Float32Array;
  histAcc: number;
  spin: number;
  yaw: number;
};

export function createPresenceState(yaw = 0): PresenceState {
  return { name: 'idle', t: 0, think: 0, speak: 0, energy: 0, hist: new Float32Array(HIST_LEN), histAcc: 0, spin: 0, yaw };
}

export function setPresence(s: PresenceState, name: PresenceName): void {
  s.name = name;
}

export function pulse(s: PresenceState, amp: number): void {
  s.energy = Math.min(MAX_ENERGY, s.energy + Math.max(0, amp) * 0.45);
}

export function step(s: PresenceState, dt: number): void {
  if (!(dt > 0)) return;
  s.t += dt;
  const [think, speak] = TARGETS[s.name];
  const k = 1 - Math.exp(-dt * 3.5);
  s.think += (think - s.think) * k;
  s.speak += (speak - s.speak) * k;
  s.energy *= Math.exp(-dt * 7);
  s.histAcc += dt;
  while (s.histAcc >= HIST_DT) {
    s.histAcc -= HIST_DT;
    s.hist.copyWithin(1, 0, HIST_LEN - 1);
    s.hist[0] = s.energy;
  }
  // Fases integradas: mudar de estado muda a velocidade, nunca a posição (sem saltos).
  s.spin += dt * (0.25 + s.think * 1.8);
  s.yaw += dt * (0.15 + s.think * 0.35);
}
