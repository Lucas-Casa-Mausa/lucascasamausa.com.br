import { describe, expect, it } from 'vitest';
import { addTokens, checkLeadRate, checkRate, checkTokenCap, createMemoryStore, RATE } from '@/server/agent/limits';

const at = (iso: string) => new Date(iso);

describe('limites', () => {
  it('10 por minuto por IP', async () => {
    const store = createMemoryStore();
    const now = at('2026-09-24T10:00:10Z');
    for (let i = 0; i < RATE.perMinute; i++) expect(await checkRate(store, '1.1.1.1', now)).toEqual({ ok: true });
    expect(await checkRate(store, '1.1.1.1', now)).toEqual({ ok: false, reason: 'minute' });
    expect(await checkRate(store, '2.2.2.2', now)).toEqual({ ok: true });
  });

  it('o minuto seguinte libera, mas o dia acumula até 40', async () => {
    const store = createMemoryStore();
    let ok = 0;
    for (let m = 0; m < 6; m++) {
      for (let i = 0; i < RATE.perMinute; i++) {
        const r = await checkRate(store, '1.1.1.1', at(`2026-09-24T10:0${m}:00Z`));
        if (r.ok) ok++;
        else expect(r.reason).toBe('day');
      }
    }
    expect(ok).toBe(RATE.perDay);
  });

  it('teto diário de tokens', async () => {
    const store = createMemoryStore();
    const now = at('2026-09-24T10:00:00Z');
    expect(await checkTokenCap(store, now, 1000)).toBe(true);
    await addTokens(store, now, 999);
    expect(await checkTokenCap(store, now, 1000)).toBe(true);
    await addTokens(store, now, 1);
    expect(await checkTokenCap(store, now, 1000)).toBe(false);
    expect(await checkTokenCap(store, at('2026-09-25T00:00:01Z'), 1000)).toBe(true);
  });

  it('5 leads por dia por IP', async () => {
    const store = createMemoryStore();
    const now = at('2026-09-24T10:00:00Z');
    for (let i = 0; i < RATE.leadsPerDay; i++) expect(await checkLeadRate(store, '1.1.1.1', now)).toBe(true);
    expect(await checkLeadRate(store, '1.1.1.1', now)).toBe(false);
  });
});
