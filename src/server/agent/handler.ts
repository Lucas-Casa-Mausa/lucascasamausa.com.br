import { convertToModelMessages, stepCountIs, streamText, type LanguageModel, type UIMessage } from 'ai';
import { addTokens, checkRate, checkTokenCap, type LimitStore } from './limits';
import { buildSystemPrompt } from './knowledge';
import { PROVIDER_OPTIONS } from './models';
import { createRedactor } from './output-filter';
import { AgentRequestBody, MAX_MESSAGE_CHARS, MAX_USER_TURNS, userTexts } from './schemas';
import { createTools } from './tools';

export type AgentDeps = {
  model: LanguageModel;
  store: LimitStore;
  now: () => Date;
  tokenCap: number;
  denylist: string[];
  verifyTurnstile: (token: string | undefined, ip: string) => Promise<boolean>;
};

const json = (status: number, data: unknown) => Response.json(data, { status });
const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

export async function handleAgentRequest(req: Request, deps: AgentDeps): Promise<Response> {
  const parsed = AgentRequestBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: 'body' });
  const { locale, messages, turnstileToken } = parsed.data;

  const texts = userTexts(messages);
  if (texts.length > MAX_USER_TURNS) return json(400, { error: 'turns' });
  if (texts.some((t) => t.length > MAX_MESSAGE_CHARS)) return json(400, { error: 'length' });

  const ip = clientIp(req);
  if (texts.length === 1 && !(await deps.verifyTurnstile(turnstileToken, ip))) return json(403, { error: 'turnstile' });

  const now = deps.now();
  const rate = await checkRate(deps.store, ip, now);
  if (!rate.ok) return json(429, { error: 'rate' });
  if (!(await checkTokenCap(deps.store, now, deps.tokenCap))) return json(503, { error: 'cap' });

  const redactor = createRedactor(locale, deps.denylist);
  const result = streamText({
    model: deps.model,
    system: buildSystemPrompt(locale),
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
    tools: createTools(locale),
    stopWhen: stepCountIs(4),
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
    onFinish: async ({ totalUsage }) => {
      await addTokens(deps.store, now, totalUsage?.totalTokens ?? 0);
    },
  });
  return result.toUIMessageStreamResponse();
}
