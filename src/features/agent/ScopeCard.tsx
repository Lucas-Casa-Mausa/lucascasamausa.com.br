import type { AgentLabels } from './labels';

type Output = {
  scope: { kind: string; features: string[]; addons: string[]; thirdPartyIntegrations: number; openQuestions: string[] };
  estimate: { outOfScope: true } | { outOfScope: false; minWeeks: number; maxWeeks: number };
};

export function ScopeCard({ output, labels }: { output: Output; labels: AgentLabels }) {
  const { estimate: e, scope } = output;
  return (
    <section data-scope-card className="my-4 max-w-md border border-line-dark p-4 font-mono text-[12px] text-muted">
      <p className="text-amber uppercase tracking-[0.08em]">{labels.scopeTitle}</p>
      <ul className="mt-2 list-inside list-disc text-bone">
        {scope.features.map((f) => <li key={f}>{f}</li>)}
        {scope.addons.map((a) => <li key={a}>{a}</li>)}
      </ul>
      {e.outOfScope ? (
        <p className="mt-3 text-bone">{labels.scopeOut}</p>
      ) : (
        <p className="mt-3 text-lg text-bone">
          {labels.scopeWeeks.replace('{min}', String(e.minWeeks)).replace('{max}', String(e.maxWeeks))}
        </p>
      )}
      <p className="mt-2">{labels.scopeNote}</p>
    </section>
  );
}
