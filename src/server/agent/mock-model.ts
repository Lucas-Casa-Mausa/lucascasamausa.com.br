import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';

type Chunk = Record<string, unknown> & { type: string };
// Formato LanguageModelV3: usage estruturado e finishReason como objeto.
const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 20, text: 20, reasoning: 0 },
};
const finish = (unified: 'stop' | 'tool-calls') => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage });

const text = (t: string): Chunk[] => [
  { type: 'text-start', id: 't1' },
  { type: 'text-delta', id: 't1', delta: t },
  { type: 'text-end', id: 't1' },
  finish('stop'),
];
const call = (toolName: string, input: unknown): Chunk[] => [
  { type: 'tool-call', toolCallId: `call-${toolName}`, toolName, input: JSON.stringify(input) },
  finish('tool-calls'),
];

/** Último texto do usuário e se o turno anterior foi um resultado de ferramenta. */
function inspect(prompt: Array<{ role: string; content: unknown }>) {
  const last = prompt[prompt.length - 1];
  const afterTool = last?.role === 'tool';
  const lastUser = [...prompt].reverse().find((m) => m.role === 'user');
  const userText = Array.isArray(lastUser?.content)
    ? (lastUser.content as Array<{ type: string; text?: string }>).map((p) => p.text ?? '').join(' ')
    : String(lastUser?.content ?? '');
  return { afterTool, userText: userText.toLowerCase() };
}

/** Modelo com roteiro fixo para testes e e2e (só com AGENT_ALLOW_MOCK=1). */
export function createScriptedMockModel() {
  return new MockLanguageModelV3({
    doStream: async ({ prompt }) => {
      const { afterTool, userText } = inspect(prompt as Array<{ role: string; content: unknown }>);
      let chunks: Chunk[];
      if (userText.includes('erro')) throw new Error('mock provider failure');
      if (afterTool) chunks = text('Estimativa inicial, a confirmar com o Lucas.');
      else if (userText.includes('clínica'))
        chunks = call('update_scope', { kind: 'web_system', features: ['agendamento'], addons: ['whatsapp'], thirdPartyIntegrations: 0, openQuestions: [] });
      else if (userText.includes('recrutador')) chunks = call('show_project', { slug: 'threads' });
      else if (userText.includes('contato')) chunks = call('request_contact', {});
      else if (userText.includes('preço')) chunks = text('Fica em torno de R$ 5.000.');
      else chunks = text('Oi! Sou o agente do portfolio do Lucas.');
      return { stream: simulateReadableStream({ chunks: chunks as never[] }) };
    },
  });
}
