import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content/types';
import { PlateDiagram } from '@/features/plates/PlateDiagram';
import { localePath, type Locale } from '@/i18n/locales';

const sectionTitle = 'font-mono text-[11px] tracking-[0.08em] text-vermilion uppercase';

export async function CaseStudy({ project, locale }: { project: Project; locale: Locale }) {
  const t = await getTranslations('case');
  const tw = await getTranslations('work');

  return (
    <article className="mx-auto max-w-[1100px] border-[1.5px] border-ink bg-paper p-4 md:p-10">
      <div className="flex items-baseline justify-between gap-4 font-mono text-[11px] tracking-[0.08em] uppercase">
        <span>
          {tw('plate')} {project.plate}
        </span>
        {project.badge && (
          <span data-badge={project.badge} className="stamp">
            {tw(project.badge)}
          </span>
        )}
      </div>

      <h1 className="mt-6 font-display text-[clamp(3rem,12vw,7rem)] leading-[0.85] tracking-[-0.03em] uppercase [overflow-wrap:anywhere]">
        {project.title}
      </h1>
      <p className="mt-4 max-w-[40ch] font-serif text-2xl italic">{project.tagline[locale]}</p>

      <div className="my-10">
        <PlateDiagram diagram={project.diagram} locale={locale} />
      </div>

      {project.action === 'try-agent' && (
        <button type="button" data-agent-open className="mb-10 inline-flex min-h-11 items-center gap-2 self-start border-b-[1.5px] border-vermilion font-mono text-sm tracking-[0.06em] text-vermilion uppercase">
          {tw('tryAgent')} ›
        </button>
      )}

      {project.badge === 'confidential' && (
        <p className="mb-10 border-l-2 border-vermilion pl-3 font-mono text-sm">{t('confidentialNote')}</p>
      )}

      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <h2 className={sectionTitle}>{t('problem')}</h2>
          <p className="mt-3 text-lg">{project.problem[locale]}</p>
        </section>
        <section>
          <h2 className={sectionTitle}>{t('solution')}</h2>
          <p className="mt-3 text-lg">{project.solution[locale]}</p>
        </section>
      </div>

      <section className="mt-10">
        <h2 className={sectionTitle}>{t('decisions')}</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {project.decisions[locale].map((d, i) => (
            <li key={d} className="grid grid-cols-[2.5rem_1fr] gap-2 text-lg">
              <span className="font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitle}>{t('stack')}</h2>
        <ul className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
          {project.stack.map((s) => (
            <li key={s} className="border border-ink px-2 py-1">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {project.links.length > 0 && (
        <section className="mt-10">
          <h2 className={sectionTitle}>{t('links')}</h2>
          <ul className="mt-3 flex flex-wrap gap-6">
            {project.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center border-b-[1.5px] border-vermilion font-mono text-sm tracking-[0.06em] text-vermilion uppercase"
                >
                  {tw(l.kind)} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={`${localePath(locale, '/')}#trabalho`}
        className="mt-12 inline-flex min-h-11 items-center font-mono text-sm tracking-[0.06em] uppercase"
      >
        ← {t('back')}
      </Link>
    </article>
  );
}
