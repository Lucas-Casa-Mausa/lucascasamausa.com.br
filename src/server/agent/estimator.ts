export type ProjectKind = 'landing' | 'site_admin' | 'web_system' | 'ai_agent' | 'mobile_native';
export type Addon = 'whatsapp' | 'payments' | 'i18n';
export type Scope = {
  kind: ProjectKind;
  features: string[];
  addons: Addon[];
  thirdPartyIntegrations: number;
  openQuestions: string[];
};
export type Estimate = { outOfScope: true } | { outOfScope: false; minWeeks: number; maxWeeks: number };

type Range = readonly [number, number];

/**
 * Semanas. Generosa de propósito (~1,5x o otimista): melhor entregar antes do que atrasar enquanto o Lucas
 * calibra o ritmo. Recalibrar depois dos primeiros projetos — mudar aqui é trocar um número.
 */
export const ESTIMATOR_TABLE = {
  base: { landing: [2, 3], site_admin: [4, 6], web_system: [6, 12], ai_agent: [3, 6] } satisfies Record<
    Exclude<ProjectKind, 'mobile_native'>,
    Range
  >,
  addon: { whatsapp: [2, 3], payments: [2, 3], i18n: [1, 2] } satisfies Record<Addon, Range>,
  thirdPartyEach: [2, 3] as Range,
} as const;

export function estimate(scope: Scope): Estimate {
  if (scope.kind === 'mobile_native') return { outOfScope: true };
  let [min, max] = ESTIMATOR_TABLE.base[scope.kind];
  for (const addon of new Set(scope.addons)) {
    min += ESTIMATOR_TABLE.addon[addon][0];
    max += ESTIMATOR_TABLE.addon[addon][1];
  }
  min += ESTIMATOR_TABLE.thirdPartyEach[0] * scope.thirdPartyIntegrations;
  max += ESTIMATOR_TABLE.thirdPartyEach[1] * scope.thirdPartyIntegrations;
  return { outOfScope: false, minWeeks: min, maxWeeks: max };
}
