import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HTML_LANG, localePath, type Locale } from '@/i18n/locales';

const SECTIONS = [
  { id: 'trabalho', key: 'work' },
  { id: 'lab', key: 'lab' },
  { id: 'sobre', key: 'about' },
  { id: 'contato', key: 'contact' },
] as const;

export async function Nav({ locale, path }: { locale: Locale; path: string }) {
  const t = await getTranslations('nav');
  const ta = await getTranslations('agent');
  const other: Locale = locale === 'pt' ? 'en' : 'pt';
  const home = localePath(locale, '/');

  return (
    <header className="sticky top-0 z-40 border-b border-line-dark bg-ink">
      <nav
        aria-label={t('label')}
        className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 font-mono text-[11px] tracking-[0.08em] text-muted uppercase md:px-8"
      >
        <Link href={home} className="inline-flex min-h-11 items-center text-bone">
          Casa Mausa
        </Link>

        <ul className="hidden gap-6 md:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link href={`${home}#${s.id}`} className="inline-flex min-h-11 items-center hover:text-bone">
                {t(s.key)}
              </Link>
            </li>
          ))}
          <li>
            <a href="#agente" data-agent-open className="inline-flex min-h-11 items-center text-amber hover:text-bone">
              {ta('nav')}
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <Link
            href={localePath(other, path)}
            hrefLang={HTML_LANG[other]}
            aria-label={t('switchTo')}
            className="inline-flex min-h-11 items-center text-bone"
          >
            {other.toUpperCase()}
          </Link>

          {/* Menu mobile sem JS: abre via :target (#menu) e fecha sozinho quando um link de seção muda o alvo.
              Links nativos (<a>), porque o pushState do next/link não atualiza :target. */}
          <a href="#menu" className="flex min-h-11 items-center text-bone md:hidden">
            {t('menu')}
          </a>
        </div>
      </nav>
      <div id="menu" className="hidden border-t border-line-dark bg-ink target:block md:hidden">
        <ul className="flex flex-col px-4 py-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`${home}#${s.id}`} className="flex min-h-11 items-center text-bone">
                {t(s.key)}
              </a>
            </li>
          ))}
          <li>
            <a href="#agente" data-agent-open className="flex min-h-11 items-center text-amber">
              {ta('nav')}
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
