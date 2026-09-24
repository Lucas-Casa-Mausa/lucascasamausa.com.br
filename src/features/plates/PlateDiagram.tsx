import { DIAGRAM_VIEWBOX } from '@/content/projects';
import type { Diagram, DiagramNode } from '@/content/types';
import type { Locale } from '@/i18n/locales';

const center = (n: DiagramNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
const PLANES = [0, 1, 2] as const;

/** Três <svg> empilhados, um por camada. Montados, parecem um desenho só; o movimento os separa em Z. */
export function PlateDiagram({ diagram, locale }: { diagram: Diagram; locale: Locale }) {
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const label = diagram.nodes.map((n) => n.label[locale]).join(', ');

  return (
    <div data-explode-wrap>
      <div data-explode>
        {PLANES.map((plane) => {
          const nodes = diagram.nodes.filter((n) => n.layer === plane);
          if (plane !== 0 && nodes.length === 0) return null;
          const a11y = plane === 0 ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
          return (
            <svg
              key={plane}
              data-plane={plane}
              viewBox={`0 0 ${DIAGRAM_VIEWBOX.w} ${DIAGRAM_VIEWBOX.h}`}
              className="h-auto w-full"
              {...a11y}
            >
              {plane === 0 && (
                <g fill="none" className="stroke-ink" strokeWidth={1}>
                  {diagram.edges.map((e) => {
                    const from = byId.get(e.from);
                    const to = byId.get(e.to);
                    if (!from || !to) return null;
                    const a = center(from);
                    const b = center(to);
                    const midX = (a.x + b.x) / 2;
                    return <path key={`${e.from}-${e.to}`} d={`M${a.x} ${a.y} H${midX} V${b.y} H${b.x}`} />;
                  })}
                </g>
              )}
              {nodes.map((n) => (
                <g key={n.id} data-layer={n.layer} data-node={n.id}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} className="fill-paper stroke-ink" strokeWidth={1.2} />
                  <text
                    x={n.x + n.w / 2}
                    y={n.y + n.h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    className="fill-ink font-mono"
                  >
                    {n.label[locale]}
                  </text>
                  <text x={n.x + 2} y={n.y - 3} fontSize={6} className="fill-vermilion font-mono" aria-hidden="true">
                    L{n.layer}
                  </text>
                </g>
              ))}
            </svg>
          );
        })}
      </div>
    </div>
  );
}
