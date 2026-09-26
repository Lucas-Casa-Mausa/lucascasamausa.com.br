import type { Ref } from 'react';
import type { Detail } from './armillary';
import { staticFrame, VIEWBOX } from './static-frame';

type Props = {
  detail: Detail;
  /** Tamanho fixo (ex.: "size-9"). Sem ele, o span não tem dimensão e o CLS aparece. */
  className: string;
  /** Miniaturas que o startMotion monta. O overlay não passa `kind`. */
  kind?: 'nav' | 'prompt';
  /** Marca os hosts do overlay (usado nos testes e2e). */
  host?: boolean;
  ref?: Ref<HTMLSpanElement>;
};

/** Quadro fixo da forma armilar: placeholder antes do JS e fallback no static. O canvas monta por cima. */
export function PresenceMark({ detail, className, kind, host, ref }: Props) {
  const { paths, dots } = staticFrame(detail);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-agent-presence={kind}
      data-presence-host={host ? '' : undefined}
      className={`relative inline-block shrink-0 ${className}`}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} data-presence-svg className="absolute inset-0 size-full" focusable="false">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.bone ? 'var(--color-bone)' : 'var(--color-amber)'} strokeOpacity={p.opacity}
            strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.bone ? 'var(--color-bone)' : 'var(--color-amber)'} fillOpacity={d.opacity} />
        ))}
      </svg>
    </span>
  );
}
