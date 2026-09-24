import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content/types';
import { localePath, type Locale } from '@/i18n/locales';
import { PlateDiagram } from './PlateDiagram';
import { TitleBlock } from './TitleBlock';

export async function Plate({ project, locale }: { project: Project; locale: Locale }) {
  const t = await getTranslations('work');
  const titleId = `plate-${project.slug}`;

  return (
    <article id={project.slug} aria-labelledby={titleId} className="relative border-[1.5px] border-ink bg-paper p-4 md:p-8">
      <div className="flex items-baseline justify-between gap-4 font-mono text-[11px] tracking-[0.08em] uppercase">
        <span>
          {t('plate')} {project.plate}
        </span>
        {project.badge && (
          <span data-badge={project.badge} className="stamp">
            {t(project.badge)}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <PlateDiagram diagram={project.diagram} locale={locale} />
        </div>
        <div className="flex flex-col gap-4 md:col-span-5">
          <h3
            id={titleId}
            className="font-display text-4xl leading-[0.9] tracking-[-0.02em] uppercase [overflow-wrap:anywhere] md:text-5xl"
          >
            {project.title}
          </h3>
          <p className="font-serif text-xl italic">{project.tagline[locale]}</p>
          <ul aria-label="Stack" className="flex flex-wrap gap-2 font-mono text-[11px]">
            {project.stack.map((s) => (
              <li key={s} className="border border-ink px-2 py-1">
                {s}
              </li>
            ))}
          </ul>
          <Link
            href={localePath(locale, `/trabalho/${project.slug}`)}
            aria-label={`${t('viewCase')}: ${project.title}`}
            className="mt-auto inline-flex min-h-11 items-center gap-2 self-start border-b-[1.5px] border-vermilion font-mono text-sm tracking-[0.06em] text-vermilion uppercase"
          >
            {t('viewCase')} →
          </Link>
        </div>
      </div>

      <TitleBlock slug={project.slug} />
    </article>
  );
}
