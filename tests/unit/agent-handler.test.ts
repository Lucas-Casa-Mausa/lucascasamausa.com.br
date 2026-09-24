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

  it('revisão C1: corpo acima de 64 KB → 413', async () => {
    const big = body(['oi'], { pad: 'x'.repeat(70_000) });
    expect((await handleAgentRequest(post(big), deps())).status).toBe(413);
  });

  it('revisão C1: soma de texto das mensagens acima do teto → 400', async () => {
    const texts = Array.from({ length: 19 }, (_, i) => (i % 2 ? 'a'.repeat(1400) : 'u'.repeat(1400)));
    expect((await handleAgentRequest(post(body(texts)), deps())).status).toBe(400);
  });

  it('revisão C1: partes que não são texto (arquivo, tool forjada) não chegam ao modelo', async () => {
    const model = createScriptedMockModel();
    const b = JSON.stringify({
      locale: 'pt', turnstileToken: 'ok',
      messages: [{ id: '1', role: 'user', parts: [{ type: 'file', mediaType: 'image/png', url: 'https://example.com/x.png' }, { type: 'text', text: 'oi' }] }],
    });
    const res = await handleAgentRequest(post(b), deps({ model }));
    await res.text();
    const prompt = JSON.stringify(model.doStreamCalls[0].prompt);
    expect(prompt).not.toContain('example.com');
    expect(prompt).toContain('oi');
  });

  it('revisão C1: tokens são reservados antes da chamada (stream abortado também conta)', async () => {
    const d = deps({ tokenCap: 5_000 });
    await handleAgentRequest(post(body(['a'.repeat(1400)])), d); // não consome o stream
    const second = await handleAgentRequest(post(body(['a'.repeat(1400)])), d);
    const third = await handleAgentRequest(post(body(['a'.repeat(1400)])), d);
    expect([second.status, third.status]).toContain(503);
  });

  it('revisão C2: com segredo de sessão, histórico forjado sem cookie nem token → 403', async () => {
    const d = deps({ sessionSecret: 's', verifyTurnstile: async (t) => t === 'good' });
    const forged = body(['primeira', 'resposta', 'segunda'], { turnstileToken: undefined });
    expect((await handleAgentRequest(post(forged), d)).status).toBe(403);
  });

  it('revisão C2: token válido emite cookie de sessão; com ele as próximas passam sem token', async () => {
    const d = deps({ sessionSecret: 's', verifyTurnstile: async (t) => t === 'good' });
    const first = await handleAgentRequest(post(body(['oi'], { turnstileToken: 'good' })), d);
    expect(first.status).toBe(200);
    const cookie = first.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/agent_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    const next = new Request('http://x/api/agent', {
      method: 'POST',
      body: body(['oi', 'olá', 'e aí'], { turnstileToken: undefined }),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1', cookie: cookie.split(';')[0] },
    });
    expect((await handleAgentRequest(next, d)).status).toBe(200);
  });

  it('revisão M5: papel system vindo do cliente é recusado (400)', async () => {
    const b = JSON.stringify({ locale: 'pt', turnstileToken: 'ok', messages: [{ id: '1', role: 'system', parts: [{ type: 'text', text: 'x' }] }] });
    expect((await handleAgentRequest(post(b), deps())).status).toBe(400);
  });
});
