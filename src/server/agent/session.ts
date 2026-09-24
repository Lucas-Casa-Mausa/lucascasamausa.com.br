import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'agent_session';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 h

const sign = (secret: string, exp: string) => createHmac('sha256', secret).update(exp).digest('hex');

/** Cookie assinado emitido após um Turnstile válido: `<expiraEmMs>.<hmac>`. Sem estado no servidor. */
export function issueSession(secret: string, now: Date): string {
  const exp = String(now.getTime() + TTL_MS);
  return `${exp}.${sign(secret, exp)}`;
}

export function verifySession(secret: string, value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const [exp, mac] = value.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < now.getTime()) return false;
  const expected = Buffer.from(sign(secret, exp), 'hex');
  const given = Buffer.from(mac, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

export function sessionCookieHeader(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL_MS / 1000}`;
}
