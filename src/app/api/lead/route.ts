import { Resend } from 'resend';
import { createMemoryStore, createUpstashStore } from '@/server/agent/limits';
import { verifyTurnstile } from '@/server/agent/turnstile';
import { handleLeadRequest } from '@/server/lead/handler';

// Memória só no modo mock (testes); em produção sem Upstash o lead responde 503 e a UI mostra o e-mail direto.
const store = createUpstashStore() ?? (process.env.AGENT_ALLOW_MOCK === '1' ? createMemoryStore() : null);

export async function POST(req: Request) {
  if (!store) return Response.json({ error: 'unavailable' }, { status: 503 });
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  // Sem domínio verificado no Resend, o remetente de teste só entrega para o dono da conta — suficiente para o Lucas.
  const from = process.env.LEAD_FROM_EMAIL ?? 'Portfolio <onboarding@resend.dev>';
  return handleLeadRequest(req, {
    store,
    now: () => new Date(),
    sessionSecret: process.env.AGENT_SESSION_SECRET ?? process.env.TURNSTILE_SECRET_KEY,
    verifyTurnstile,
    globalDailyCap: Number(process.env.LEAD_DAILY_CAP ?? 30),
    ipHeader: process.env.CLIENT_IP_HEADER ?? 'x-forwarded-for',
    send: async ({ subject, text, replyTo }) => {
      if (process.env.AGENT_ALLOW_MOCK === '1' && !apiKey) return; // e2e: não envia de verdade
      if (!apiKey || !to) throw new Error('lead mail not configured');
      const { error } = await new Resend(apiKey).emails.send({ from, to, subject, text, replyTo });
      if (error) throw new Error(error.message);
    },
  });
}
