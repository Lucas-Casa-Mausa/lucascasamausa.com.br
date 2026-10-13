import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createProviderRegistry, type LanguageModel } from 'ai';
import { SITE_URL } from '@/lib/site';
import { createScriptedMockModel } from './mock-model';

/**
 * OpenRouter: uma chave (OPENROUTER_API_KEY) dá acesso a vários LLMs, inclusive grátis (sufixo `:free`).
 * Trocar de modelo é só mudar AGENT_MODEL ("openrouter:<id do modelo>"); o resto do agente não muda.
 * Outro provedor: `npm i @ai-sdk/<provedor>` e registrar aqui.
 */
export const DEFAULT_MODEL = 'openrouter:google/gemma-4-31b-it:free';

/** Reservas: o OpenRouter tenta em ordem se o principal estiver fora do ar, ocupado ou no limite. */
export const DEFAULT_FALLBACKS = ['nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-26b-a4b-it:free'];

// A chave é lida do ambiente na hora da chamada (no Worker, os segredos só existem em tempo de execução).
const openrouter = createOpenRouter({ headers: { 'HTTP-Referer': SITE_URL, 'X-Title': 'lucascasamausa.com.br' } });
const registry = createProviderRegistry({ openrouter });

const currentModel = () => process.env.AGENT_MODEL ?? DEFAULT_MODEL;
const stripProvider = (id: string) => id.replace(/^openrouter:/, '');

export function resolveModel(id = currentModel()): LanguageModel {
  if (id.startsWith('mock:')) {
    if (process.env.AGENT_ALLOW_MOCK !== '1') throw new Error('mock model requires AGENT_ALLOW_MOCK=1');
    return createScriptedMockModel();
  }
  return registry.languageModel(id as `openrouter:${string}`);
}

/** AGENT_FALLBACK_MODELS: ids separados por vírgula. Ausente = reservas padrão; vazio = sem reservas. */
function fallbackModels(): string[] | undefined {
  const raw = process.env.AGENT_FALLBACK_MODELS;
  const primary = stripProvider(currentModel());
  const list = raw === undefined ? DEFAULT_FALLBACKS : raw.split(',').map((s) => stripProvider(s.trim()));
  const models = [...new Set(list.filter((id) => id && id !== primary))];
  return models.length ? models : undefined;
}

/** Opções por provedor, montadas por requisição (o ambiente do Worker só existe em tempo de execução). */
export function providerOptions() {
  return { openrouter: { models: fallbackModels() } };
}
