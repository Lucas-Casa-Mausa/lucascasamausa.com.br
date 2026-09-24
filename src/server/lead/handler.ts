import { clientIp } from '@/server/agent/client-ip';
import { leadAllowed, recordLead, type LimitStore } from '@/server/agent/limits';
import { LeadBody } from '@/server/agent/schemas';
import { readCookie, SESSION_COOKIE, verifySession } from '@/server/agent/session';

export type LeadDeps = {
  store: LimitStore;
  now: () => Date;
  send: (mail: { subject: string; text: string; replyTo: string }) => Promise<void>;
  /** Com segredo: exige a sessão do agente ou um token Turnstile novo (anti-spam). */
  sessionSecret?: string;
  verifyTurnstile?: (token: string | undefined, ip: string) => Promise<boolean>;
  globalDailyCap?: number;
  ipHeader?: string;
};

// Sem quebras de linha nem controles: o nome entra no assunto do e-mail.
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

export async function handleLeadRequest(req: Request, deps: LeadDeps): Promise<Response> {
  const parsed = LeadBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'body' }, { status: 400 });
  const ip = clientIp(req, deps.ipHeader);
  const now = deps.now();

  if (deps.sessionSecret) {
    const ok =
      verifySession(deps.sessionSecret, readCookie(req, SESSION_COOKIE), now) ||
      (await deps.verifyTurnstile?.(parsed.data.turnstileToken, ip)) === true;
    if (!ok) return Response.json({ error: 'turnstile' }, { status: 403 });
  }
  if (!(await leadAllowed(deps.store, ip, now, deps.globalDailyCap ?? 30))) {
    return Response.json({ error: 'rate' }, { status: 429 });
  }

  const name = oneLine(parsed.data.name);
  const company = oneLine(parsed.data.company);
  const { email, summary, locale } = parsed.data;
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
  await recordLead(deps.store, ip, now); // só envio bem-sucedido consome o limite
  return Response.json({ ok: true });
}
