import { Redis } from '@upstash/redis';

export interface LimitStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<number>;
  incrBy(key: string, amount: number, ttlSeconds: number): Promise<number>;
}

export const RATE = { perMinute: 10, perDay: 40, leadsPerDay: 5 } as const;

const minuteKey = (now: Date) => now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM (UTC)
const dayKey = (now: Date) => now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

/** Só para testes e para o modo mock: não é compartilhado entre instâncias. */
export function createMemoryStore(): LimitStore {
  const data = new Map<string, number>();
  return {
    async incr(key) {
      const v = (data.get(key) ?? 0) + 1;
      data.set(key, v);
      return v;
    },
    async get(key) {
      return data.get(key) ?? 0;
    },
    async incrBy(key, amount) {
      const v = (data.get(key) ?? 0) + amount;
      data.set(key, v);
      return v;
    },
  };
}

/** Upstash Redis (compartilhado entre instâncias serverless). null se as envs não existirem. */
export function createUpstashStore(): LimitStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    async incr(key, ttl) {
      const v = await redis.incr(key);
      if (v === 1) await redis.expire(key, ttl);
      return v;
    },
    async get(key) {
      return Number((await redis.get<number>(key)) ?? 0);
    },
    async incrBy(key, amount, ttl) {
      const v = await redis.incrby(key, amount);
      if (v === amount) await redis.expire(key, ttl);
      return v;
    },
  };
}

export async function checkRate(store: LimitStore, ip: string, now: Date) {
  const day = await store.get(`agent:ip:${ip}:d:${dayKey(now)}`);
  if (day >= RATE.perDay) return { ok: false as const, reason: 'day' as const };
  const minute = await store.incr(`agent:ip:${ip}:m:${minuteKey(now)}`, 90);
  if (minute > RATE.perMinute) return { ok: false as const, reason: 'minute' as const };
  await store.incr(`agent:ip:${ip}:d:${dayKey(now)}`, 60 * 60 * 26);
  return { ok: true as const };
}

export async function checkTokenCap(store: LimitStore, now: Date, cap: number): Promise<boolean> {
  return (await store.get(`agent:tokens:${dayKey(now)}`)) < cap;
}

export async function addTokens(store: LimitStore, now: Date, n: number): Promise<void> {
  if (n !== 0) await store.incrBy(`agent:tokens:${dayKey(now)}`, n, 60 * 60 * 26);
}

/**
 * Reserva `estimate` tokens antes da chamada (atômico via incrBy). Se passar do teto, devolve a reserva e recusa.
 * A reserva fica valendo mesmo se o stream for abortado; no fim, ajuste com addTokens(real - estimate).
 */
export async function reserveTokens(store: LimitStore, now: Date, estimate: number, cap: number): Promise<boolean> {
  const total = await store.incrBy(`agent:tokens:${dayKey(now)}`, estimate, 60 * 60 * 26);
  if (total > cap) {
    await store.incrBy(`agent:tokens:${dayKey(now)}`, -estimate, 60 * 60 * 26);
    return false;
  }
  return true;
}

export async function checkLeadRate(store: LimitStore, ip: string, now: Date): Promise<boolean> {
  return (await store.incr(`lead:ip:${ip}:d:${dayKey(now)}`, 60 * 60 * 26)) <= RATE.leadsPerDay;
}

/** Só lê (não consome): o consumo acontece em recordLead, depois de um envio bem-sucedido. */
export async function leadAllowed(store: LimitStore, ip: string, now: Date, globalCap: number): Promise<boolean> {
  const [perIp, global] = await Promise.all([
    store.get(`lead:ip:${ip}:d:${dayKey(now)}`),
    store.get(`lead:global:d:${dayKey(now)}`),
  ]);
  return perIp < RATE.leadsPerDay && global < globalCap;
}

export async function recordLead(store: LimitStore, ip: string, now: Date): Promise<void> {
  await Promise.all([
    store.incr(`lead:ip:${ip}:d:${dayKey(now)}`, 60 * 60 * 26),
    store.incr(`lead:global:d:${dayKey(now)}`, 60 * 60 * 26),
  ]);
}
