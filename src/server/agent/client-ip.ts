import { isIP } from 'node:net';

/**
 * IP do cliente a partir do cabeçalho que o host garante (ex.: cf-connecting-ip na Cloudflare,
 * x-real-ip/x-vercel-forwarded-for na Vercel), configurado em CLIENT_IP_HEADER. Validado: lixo vira "unknown".
 */
export function clientIp(req: Request, header = 'x-forwarded-for'): string {
  const raw = req.headers.get(header) ?? '';
  const candidate = raw.split(',')[0]?.trim() ?? '';
  return isIP(candidate) ? candidate : 'unknown';
}
