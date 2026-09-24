type Part = { type: string; text?: string; state?: string; output?: unknown };
type Msg = { role: string; parts: Part[] };
type ScopeOutput = {
  scope: { kind: string; features: string[]; addons: string[]; thirdPartyIntegrations: number };
  estimate: { outOfScope: true } | { outOfScope: false; minWeeks: number; maxWeeks: number };
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Resumo legível para o e-mail do lead: últimas falas do visitante + escopo em palavras (se houver). */
export function buildSummary(messages: Msg[], maxChars = 1500): string {
  const lines: string[] = [];
  let scope: ScopeOutput | null = null;
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === 'tool-update_scope' && p.state === 'output-available') scope = p.output as ScopeOutput;
    }
  }
  const said = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join(' ').trim())
    .filter(Boolean)
    .slice(-6);
  for (const s of said) lines.push(`Visitante: ${clip(s, 240)}`);
  if (scope) {
    const e = scope.estimate;
    const parts = [
      `tipo ${scope.scope.kind}`,
      scope.scope.features.length ? `funcionalidades: ${scope.scope.features.join(', ')}` : '',
      scope.scope.addons.length ? `adicionais: ${scope.scope.addons.join(', ')}` : '',
      scope.scope.thirdPartyIntegrations ? `integrações de terceiros: ${scope.scope.thirdPartyIntegrations}` : '',
      e.outOfScope ? 'fora do escopo típico' : `prazo estimado: ${e.minWeeks}–${e.maxWeeks} semanas`,
    ].filter(Boolean);
    lines.push(`Escopo: ${parts.join('; ')}`);
  }
  return clip(lines.join('\n'), maxChars);
}
