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
