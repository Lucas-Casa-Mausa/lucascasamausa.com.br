import { Resend } from 'resend';
import { createMemoryStore, createUpstashStore } from '@/server/agent/limits';
import { handleLeadRequest } from '@/server/lead/handler';

const store = createUpstashStore() ?? createMemoryStore();

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  // Sem domínio verificado no Resend, o remetente de teste só entrega para o dono da conta — suficiente para o Lucas.
  const from = process.env.LEAD_FROM_EMAIL ?? 'Portfolio <onboarding@resend.dev>';
  return handleLeadRequest(req, {
    store,
    now: () => new Date(),
    send: async ({ subject, text, replyTo }) => {
      if (process.env.AGENT_ALLOW_MOCK === '1' && !apiKey) return; // e2e: não envia de verdade
      if (!apiKey || !to) throw new Error('lead mail not configured');
      const { error } = await new Resend(apiKey).emails.send({ from, to, subject, text, replyTo });
      if (error) throw new Error(error.message);
    },
  });
}
