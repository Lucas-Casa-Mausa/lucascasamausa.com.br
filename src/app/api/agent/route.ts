import { handleAgentRequest } from '@/server/agent/handler';
import { createMemoryStore, createUpstashStore } from '@/server/agent/limits';
import { resolveModel } from '@/server/agent/models';
import { verifyTurnstile } from '@/server/agent/turnstile';

export const maxDuration = 30;

// Memória só no modo mock (testes); em produção sem Upstash o agente fica indisponível (503) e a UI mostra o formulário.
const store = createUpstashStore() ?? (process.env.AGENT_ALLOW_MOCK === '1' ? createMemoryStore() : null);

export async function POST(req: Request) {
  if (!store) return Response.json({ error: 'unavailable' }, { status: 503 });
  try {
    return await handleAgentRequest(req, {
      model: resolveModel(),
      store,
      now: () => new Date(),
      tokenCap: Number(process.env.AGENT_DAILY_TOKEN_CAP ?? 1_500_000),
      denylist: (process.env.CONTENT_DENYLIST ?? '').split(/[,\r\n]/).map((t) => t.trim()).filter(Boolean),
      verifyTurnstile,
      sessionSecret: process.env.AGENT_SESSION_SECRET ?? process.env.TURNSTILE_SECRET_KEY,
      ipHeader: process.env.CLIENT_IP_HEADER ?? 'x-forwarded-for',
    });
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 503 });
  }
}
