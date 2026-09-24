import { describe, expect, it } from 'vitest';
import { handleAgentRequest, type AgentDeps } from '@/server/agent/handler';
import { createMemoryStore } from '@/server/agent/limits';
import { createScriptedMockModel } from '@/server/agent/mock-model';

const deps = (over: Partial<AgentDeps> = {}): AgentDeps => ({
  model: createScriptedMockModel(),
  store: createMemoryStore(),
  now: () => new Date('2026-09-24T10:00:00Z'),
  tokenCap: 1_000_000,
  denylist: ['acme'],
  verifyTurnstile: async () => true,
  ...over,
});

const body = (texts: string[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    locale: 'pt',
    turnstileToken: 'ok',
    messages: texts.map((t, i) => ({ id: String(i), role: i % 2 ? 'assistant' : 'user', parts: [{ type: 'text', text: t }] })),
    ...extra,
  });

const post = (b: string, ip = '1.1.1.1') =>
  new Request('http://x/api/agent', { method: 'POST', body: b, headers: { 'content-type': 'application/json', 'x-forwarded-for': ip } });

describe('/api/agent', () => {
  it('responde em streaming (200)', async () => {
    const res = await handleAgentRequest(post(body(['oi'])), deps());
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Lucas');
  });

  it('chama update_scope e devolve a faixa do estimador, não do modelo', async () => {
    const res = await handleAgentRequest(post(body(['tenho uma clínica e quero agendamento'])), deps());
    const text = await res.text();
    expect(text).toContain('update_scope');
    expect(text).toMatch(/"minWeeks":\s*8/); // web_system (6–12) + whatsapp (2–3) no roteiro do mock
  });

  it('filtra valor monetário mesmo que o modelo tente', async () => {
    const text = await (await handleAgentRequest(post(body(['qual o preço?'])), deps())).text();
    expect(text).not.toMatch(/R\$\s?\d/);
    expect(text).toContain('[sob consulta]');
  });

  it('400 para mensagem acima de 1500 caracteres', async () => {
    const res = await handleAgentRequest(post(body(['x'.repeat(1501)])), deps());
    expect(res.status).toBe(400);
  });

  it('400 para mais de 20 turnos do usuário', async () => {
    const texts = Array.from({ length: 41 }, (_, i) => `m${i}`);
    expect((await handleAgentRequest(post(body(texts)), deps())).status).toBe(400);
  });

  it('403 quando o Turnstile falha na primeira mensagem', async () => {
    const res = await handleAgentRequest(post(body(['oi'])), deps({ verifyTurnstile: async () => false }));
    expect(res.status).toBe(403);
  });

  it('429 depois de 10 mensagens no minuto', async () => {
    const d = deps();
    for (let i = 0; i < 10; i++) expect((await handleAgentRequest(post(body(['oi'])), d)).status).toBe(200);
    const res = await handleAgentRequest(post(body(['oi'])), d);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate' });
  });

  it('503 quando o teto diário de tokens estourou', async () => {
    const res = await handleAgentRequest(post(body(['oi'])), deps({ tokenCap: 0 }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'cap' });
  });
});
