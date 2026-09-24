import { getTranslations } from 'next-intl/server';
import { projects } from '@/content/projects';
import type { Locale } from '@/i18n/locales';
import { Plate } from './Plate';

export async function WorkSection({ locale }: { locale: Locale }) {
  const t = await getTranslations('work');
  return (
    <section id="trabalho" data-reveal aria-labelledby="work-title" className="paper-grid bg-paper px-4 py-16 text-ink md:px-8 md:py-24">
      <header className="mx-auto mb-12 max-w-[1440px]">
        <h2
          id="work-title"
          className="font-display text-[clamp(3rem,12vw,8rem)] leading-[0.85] tracking-[-0.03em] uppercase"
        >
          {t('heading')}
        </h2>
        <p className="mt-4 max-w-[48ch] font-serif text-xl italic">{t('intro')}</p>
      </header>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12">
        {projects.map((p) => (
          <Plate key={p.slug} project={p} locale={locale} />
        ))}
      </div>
    </section>
  );
}
