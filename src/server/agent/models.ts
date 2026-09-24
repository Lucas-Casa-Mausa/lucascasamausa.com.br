import { anthropic } from '@ai-sdk/anthropic';
import { createProviderRegistry, type LanguageModel } from 'ai';
import { createScriptedMockModel } from './mock-model';

export const DEFAULT_MODEL = 'anthropic:claude-haiku-4-5';

/**
 * Para trocar de provedor: `npm i @ai-sdk/<provedor>`, registrar aqui e mudar AGENT_MODEL (ex.: "openai:<modelo>").
 * O resto do agente não muda.
 */
const registry = createProviderRegistry({ anthropic });

export function resolveModel(id = process.env.AGENT_MODEL ?? DEFAULT_MODEL): LanguageModel {
  if (id.startsWith('mock:')) {
    if (process.env.AGENT_ALLOW_MOCK !== '1') throw new Error('mock model requires AGENT_ALLOW_MOCK=1');
    return createScriptedMockModel();
  }
  return registry.languageModel(id as `anthropic:${string}`);
}

/** Opções específicas por provedor; os outros provedores ignoram namespaces que não são deles. */
export const PROVIDER_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral' as const } },
};
