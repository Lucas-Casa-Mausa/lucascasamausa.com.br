import { convertToModelMessages, stepCountIs, streamText, type LanguageModel, type UIMessage } from 'ai';
import { clientIp } from './client-ip';
import { buildSystemPrompt } from './knowledge';
import { addTokens, checkRate, reserveTokens, type LimitStore } from './limits';
import { PROVIDER_OPTIONS } from './models';
import { createRedactor } from './output-filter';
import {
  AgentRequestBody,
  MAX_BODY_BYTES,
  MAX_MESSAGE_CHARS,
  MAX_TOTAL_CHARS,
  MAX_USER_TURNS,
  textOnly,
  totalChars,
  userTexts,
} from './schemas';
import { issueSession, readCookie, SESSION_COOKIE, sessionCookieHeader, verifySession } from './session';
import { createTools } from './tools';

export type AgentDeps = {
  model: LanguageModel;
  store: LimitStore;
  now: () => Date;
  tokenCap: number;
  denylist: string[];
  verifyTurnstile: (token: string | undefined, ip: string) => Promise<boolean>;
  /** Com segredo: toda requisição precisa de cookie de sessão válido ou de um token Turnstile novo. */
  sessionSecret?: string;
  ipHeader?: string;
};

const MAX_OUTPUT_TOKENS = 700;
const MAX_STEPS = 4;
const json = (status: number, data: unknown) => Response.json(data, { status });

/** Estimativa conservadora para reservar antes da chamada: entrada (~3 caracteres/token) + system + saída, por passo. */
const estimateTokens = (chars: number) => Math.ceil(chars / 3) + 2000 + MAX_OUTPUT_TOKENS * MAX_STEPS;

async function readLimited(req: Request): Promise<unknown | 'too-large'> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return 'too-large';
  const text = await req.text().catch(() => '');
  if (text.length > MAX_BODY_BYTES) return 'too-large';
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function handleAgentRequest(req: Request, deps: AgentDeps): Promise<Response> {
  const raw = await readLimited(req);
  if (raw === 'too-large') return json(413, { error: 'too-large' });
  const parsed = AgentRequestBody.safeParse(raw);
  if (!parsed.success) return json(400, { error: 'body' });
  const { locale, turnstileToken } = parsed.data;

  const messages = textOnly(parsed.data.messages);
  const texts = userTexts(parsed.data.messages);
  if (texts.length === 0) return json(400, { error: 'body' });
  if (texts.length > MAX_USER_TURNS) return json(400, { error: 'turns' });
  if (texts.some((t) => t.length > MAX_MESSAGE_CHARS)) return json(400, { error: 'length' });
  const chars = totalChars(messages);
  if (chars > MAX_TOTAL_CHARS) return json(400, { error: 'length' });

  const ip = clientIp(req, deps.ipHeader);
  const now = deps.now();

  // Anti-bot: com segredo, cookie assinado OU token novo em toda requisição (histórico forjado não basta).
  let newSession: string | null = null;
  if (deps.sessionSecret) {
    const hasSession = verifySession(deps.sessionSecret, readCookie(req, SESSION_COOKIE), now);
    if (!hasSession) {
      if (!(await deps.verifyTurnstile(turnstileToken, ip))) return json(403, { error: 'turnstile' });
      newSession = issueSession(deps.sessionSecret, now);
    }
  } else if (texts.length === 1 && !(await deps.verifyTurnstile(turnstileToken, ip))) {
    return json(403, { error: 'turnstile' });
  }

  const rate = await checkRate(deps.store, ip, now);
  if (!rate.ok) return json(429, { error: 'rate' });
  const reserved = estimateTokens(chars);
  if (!(await reserveTokens(deps.store, now, reserved, deps.tokenCap))) return json(503, { error: 'cap' });

  const redactor = createRedactor(locale, deps.denylist);
  const result = streamText({
    model: deps.model,
    system: buildSystemPrompt(locale),
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
    tools: createTools(locale, deps.denylist),
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
    providerOptions: PROVIDER_OPTIONS,
    // Filtro de saída no stream: nenhum valor monetário nem termo proibido chega ao visitante.
    experimental_transform: () =>
      new TransformStream({
        transform(part, controller) {
          if (part.type === 'text-delta') {
            const text = redactor.push(part.text);
            if (text) controller.enqueue({ ...part, text });
            return;
          }
          if (part.type === 'text-end') {
            const rest = redactor.flush();
            if (rest) controller.enqueue({ type: 'text-delta', id: part.id, text: rest });
          }
          controller.enqueue(part);
        },
      }),
    // A reserva já cobre abortos e erros; no fim normal, acerta pelo uso real.
    onFinish: async ({ totalUsage }) => {
      const used = totalUsage?.totalTokens;
      if (typeof used === 'number') await addTokens(deps.store, now, used - reserved);
    },
  });
  return result.toUIMessageStreamResponse({
    sendReasoning: false,
    headers: newSession ? { 'set-cookie': sessionCookieHeader(newSession) } : undefined,
  });
}
