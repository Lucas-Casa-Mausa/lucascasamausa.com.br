import { describe, expect, it } from 'vitest';
import { createTools } from '@/server/agent/tools';

describe('tools (I2)', () => {
  it('update_scope filtra valores e termos proibidos nas strings devolvidas', async () => {
    const tools = createTools('pt', ['acme']);
    const exec = tools.update_scope.execute as unknown as (input: unknown, opts: unknown) => Promise<{ scope: { features: string[]; openQuestions: string[] } }>;
    const out = await exec(
      { kind: 'landing', features: ['orçamento de R$ 5.000', 'integração ACME'], addons: [], thirdPartyIntegrations: 0, openQuestions: ['cinco mil reais?'] },
      { toolCallId: 't', messages: [] },
    );
    const text = JSON.stringify(out.scope);
    expect(text).not.toMatch(/5\.000|acme|cinco mil/i);
    expect(text).toContain('[sob consulta]');
  });
});
