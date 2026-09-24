import { checkLeadRate, type LimitStore } from '@/server/agent/limits';
import { LeadBody } from '@/server/agent/schemas';

export type LeadDeps = {
  store: LimitStore;
  now: () => Date;
  send: (mail: { subject: string; text: string; replyTo: string }) => Promise<void>;
};

export async function handleLeadRequest(req: Request, deps: LeadDeps): Promise<Response> {
  const parsed = LeadBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'body' }, { status: 400 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await checkLeadRate(deps.store, ip, deps.now()))) return Response.json({ error: 'rate' }, { status: 429 });

  const { name, email, company, summary, locale } = parsed.data;
  const text = [
    `Nome: ${name}`,
    `E-mail: ${email}`,
    company ? `Empresa: ${company}` : null,
    `Idioma: ${locale}`,
    '',
    'Resumo da conversa / escopo:',
    summary || '(sem resumo)',
  ]
    .filter((l) => l !== null)
    .join('\n');
  try {
    await deps.send({ subject: `Novo contato pelo portfolio — ${name}`, text, replyTo: email });
  } catch {
    return Response.json({ error: 'send' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
