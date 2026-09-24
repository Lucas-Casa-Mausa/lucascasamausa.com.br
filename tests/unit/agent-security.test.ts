import { describe, expect, it } from 'vitest';
import { clientIp } from '@/server/agent/client-ip';
import { issueSession, verifySession } from '@/server/agent/session';

const req = (headers: Record<string, string>) => new Request('http://x', { headers });

describe('clientIp (I4)', () => {
  it('lê o cabeçalho confiável configurado e valida o IP', () => {
    expect(clientIp(req({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' }), 'cf-connecting-ip')).toBe('203.0.113.7');
  });
  it('lixo ou ausência vira "unknown" (não entra cru na chave do Redis)', () => {
    expect(clientIp(req({ 'x-forwarded-for': 'not-an-ip' + 'x'.repeat(500) }), 'x-forwarded-for')).toBe('unknown');
    expect(clientIp(req({}), 'x-forwarded-for')).toBe('unknown');
  });
  it('x-forwarded-for usa o primeiro endereço válido', () => {
    expect(clientIp(req({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' }), 'x-forwarded-for')).toBe('198.51.100.2');
  });
});

describe('sessão assinada pós-Turnstile (C2)', () => {
  const secret = 'test-secret';
  const now = new Date('2026-09-24T10:00:00Z');
  it('cookie emitido é válido até expirar', () => {
    const value = issueSession(secret, now);
    expect(verifySession(secret, value, now)).toBe(true);
    expect(verifySession(secret, value, new Date(now.getTime() + 3 * 3600_000))).toBe(false);
  });
  it('cookie adulterado ou com outro segredo é recusado', () => {
    const value = issueSession(secret, now);
    expect(verifySession(secret, value.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a')), now)).toBe(false);
    expect(verifySession('outro', value, now)).toBe(false);
    expect(verifySession(secret, undefined, now)).toBe(false);
    expect(verifySession(secret, 'lixo', now)).toBe(false);
  });
});
