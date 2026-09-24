import { DIAGRAM_VIEWBOX } from '@/content/projects';
import type { Diagram, DiagramNode } from '@/content/types';
import type { Locale } from '@/i18n/locales';

const center = (n: DiagramNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

export function PlateDiagram({ diagram, locale }: { diagram: Diagram; locale: Locale }) {
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const label = diagram.nodes.map((n) => n.label[locale]).join(', ');

  return (
    <svg
      viewBox={`0 0 ${DIAGRAM_VIEWBOX.w} ${DIAGRAM_VIEWBOX.h}`}
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
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
      {diagram.nodes.map((n) => (
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
}
