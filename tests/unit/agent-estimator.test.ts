import { describe, expect, it } from 'vitest';
import { estimate, type Scope } from '@/server/agent/estimator';

const scope = (over: Partial<Scope> = {}): Scope => ({
  kind: 'landing',
  features: [],
  addons: [],
  thirdPartyIntegrations: 0,
  openQuestions: [],
  ...over,
});

describe('estimador (generoso, §4.5)', () => {
  it('bases', () => {
    expect(estimate(scope({ kind: 'landing' }))).toEqual({ outOfScope: false, minWeeks: 2, maxWeeks: 3 });
    expect(estimate(scope({ kind: 'site_admin' }))).toEqual({ outOfScope: false, minWeeks: 4, maxWeeks: 6 });
    expect(estimate(scope({ kind: 'web_system' }))).toEqual({ outOfScope: false, minWeeks: 6, maxWeeks: 12 });
    expect(estimate(scope({ kind: 'ai_agent' }))).toEqual({ outOfScope: false, minWeeks: 3, maxWeeks: 6 });
  });

  it('adicionais somam', () => {
    expect(estimate(scope({ kind: 'web_system', addons: ['whatsapp', 'payments'] }))).toEqual({
      outOfScope: false,
      minWeeks: 10,
      maxWeeks: 18,
    });
    expect(estimate(scope({ kind: 'landing', addons: ['i18n'] }))).toEqual({ outOfScope: false, minWeeks: 3, maxWeeks: 5 });
  });

  it('cada integração de terceiros soma +2–3', () => {
    expect(estimate(scope({ kind: 'site_admin', thirdPartyIntegrations: 2 }))).toEqual({
      outOfScope: false,
      minWeeks: 8,
      maxWeeks: 12,
    });
  });

  it('adicional repetido conta uma vez', () => {
    expect(estimate(scope({ addons: ['whatsapp', 'whatsapp'] }))).toEqual(estimate(scope({ addons: ['whatsapp'] })));
  });

  it('app mobile nativo está fora do escopo típico', () => {
    expect(estimate(scope({ kind: 'mobile_native', addons: ['payments'] }))).toEqual({ outOfScope: true });
  });
});
