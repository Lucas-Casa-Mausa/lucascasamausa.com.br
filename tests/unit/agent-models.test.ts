import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FALLBACKS, DEFAULT_MODEL, providerOptions, resolveModel } from '@/server/agent/models';

afterEach(() => vi.unstubAllEnvs());

const info = (m: ReturnType<typeof resolveModel>) => m as unknown as { provider: string; modelId: string };

describe('resolveModel', () => {
  it('o padrão é um modelo grátis do OpenRouter', () => {
    expect(DEFAULT_MODEL).toMatch(/^openrouter:.+:free$/);
  });

  it('resolve "openrouter:<modelo>" mantendo o sufixo :free no id do modelo', () => {
    const m = info(resolveModel('openrouter:google/gemma-4-31b-it:free'));
    expect(m.provider).toMatch(/^openrouter/);
    expect(m.modelId).toBe('google/gemma-4-31b-it:free');
  });

  it('provedor não registrado falha alto (sem cair em outro em silêncio)', () => {
    expect(() => resolveModel('anthropic:claude-haiku-4-5')).toThrow();
  });

  it('o mock continua exigindo AGENT_ALLOW_MOCK=1', () => {
    vi.stubEnv('AGENT_ALLOW_MOCK', '');
    expect(() => resolveModel('mock:scripted')).toThrow(/AGENT_ALLOW_MOCK/);
    vi.stubEnv('AGENT_ALLOW_MOCK', '1');
    expect(info(resolveModel('mock:scripted')).modelId).toBeTruthy();
  });
});

describe('providerOptions (modelos de reserva do OpenRouter)', () => {
  it('sem AGENT_FALLBACK_MODELS usa as reservas padrão, todas grátis', () => {
    vi.stubEnv('AGENT_FALLBACK_MODELS', undefined as unknown as string);
    expect(providerOptions().openrouter.models).toEqual(DEFAULT_FALLBACKS);
    expect(DEFAULT_FALLBACKS.length).toBeGreaterThan(0);
    for (const id of DEFAULT_FALLBACKS) expect(id).toMatch(/:free$/);
  });

  it('lê a lista separada por vírgula, tira espaços, prefixo "openrouter:" e repetidos', () => {
    vi.stubEnv('AGENT_FALLBACK_MODELS', ' a/x:free, openrouter:b/y:free ,a/x:free,, ');
    expect(providerOptions().openrouter.models).toEqual(['a/x:free', 'b/y:free']);
  });

  it('não repete o modelo principal como reserva', () => {
    vi.stubEnv('AGENT_MODEL', 'openrouter:a/x:free');
    vi.stubEnv('AGENT_FALLBACK_MODELS', 'a/x:free,b/y:free');
    expect(providerOptions().openrouter.models).toEqual(['b/y:free']);
  });

  it('valor vazio desliga as reservas', () => {
    vi.stubEnv('AGENT_FALLBACK_MODELS', '');
    expect(providerOptions().openrouter.models).toBeUndefined();
  });
});

describe('requisição ao OpenRouter (fetch interceptado, sem rede)', () => {
  it('envia o modelo, as reservas e a chave lida do ambiente na hora da chamada', async () => {
    const { generateText } = await import('ai');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('AGENT_MODEL', 'openrouter:a/x:free');
    vi.stubEnv('AGENT_FALLBACK_MODELS', 'b/y:free');
    let sent: { url: string; auth: string | null; body: Record<string, unknown> } | null = null;
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      sent = { url: String(url), auth: new Headers(init.headers).get('authorization'), body: JSON.parse(String(init.body)) };
      return new Response(
        JSON.stringify({
          id: '1', object: 'chat.completion', created: 0, model: 'a/x:free',
          choices: [{ index: 0, message: { role: 'assistant', content: 'oi' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    try {
      const { text } = await generateText({ model: resolveModel(), prompt: 'oi', providerOptions: providerOptions() });
      expect(text).toBe('oi');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(sent!.url).toMatch(/^https:\/\/openrouter\.ai\/api\/v1\/chat\/completions/);
    expect(sent!.auth).toBe('Bearer test-key');
    expect(sent!.body.model).toBe('a/x:free');
    expect(sent!.body.models).toEqual(['b/y:free']);
  });
});
