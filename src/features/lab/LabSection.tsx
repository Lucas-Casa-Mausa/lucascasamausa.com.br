import { getTranslations } from 'next-intl/server';
import { labItems } from '@/content/lab';
import type { Locale } from '@/i18n/locales';

export async function LabSection({ locale }: { locale: Locale }) {
  const t = await getTranslations('lab');
  return (
    <section id="lab" aria-labelledby="lab-title" className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1440px]">
        <h2 id="lab-title" className="font-display text-[clamp(3rem,12vw,8rem)] leading-[0.85] tracking-[-0.03em] uppercase">
          {t('heading')}
        </h2>
        <p className="mt-4 max-w-[48ch] text-muted">{t('intro')}</p>
        <ol className="mt-10 border-b border-line-dark">
          {labItems.map((item, i) => (
            <li key={item.name} className="grid gap-2 border-t border-line-dark py-5 md:grid-cols-12 md:gap-6">
              <span className="font-mono text-[11px] text-amber md:col-span-1">[{String(i + 1).padStart(2, '0')}]</span>
              <h3 className="font-mono text-base text-bone md:col-span-3">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 hover:text-amber">
                    {item.name} ↗
                  </a>
                ) : (
                  item.name
                )}
              </h3>
              <p className="text-muted md:col-span-5">{item.description[locale]}</p>
              <p className="font-mono text-[11px] text-muted md:col-span-3">{item.stack.join(' · ')}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
