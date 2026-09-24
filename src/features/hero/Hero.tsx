import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/locales';
import { HeroPrompt } from './HeroPrompt';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations('hero');
  return (
    <section
      aria-labelledby="hero-title"
      data-hero
      className="grid-lines-dark relative flex min-h-[calc(100svh-61px)] flex-col justify-between gap-10 px-4 pt-6 pb-10 md:px-8"
    >
      <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{t('location')}</p>
      <h1
        id="hero-title"
        data-hero-name
        className="font-display text-[clamp(4.5rem,22vw,15rem)] leading-[0.8] tracking-[-0.04em] text-bone uppercase md:text-[clamp(6rem,14vw,22rem)]"
      >
        {/* Mobile: três linhas. Desktop: "LUCAS" / "CASA MAUSA", ocupando a largura como no mockup. */}
        <span className="block">Lucas</span>{' '}
        <span className="text-outline block md:inline">Casa</span>{' '}
        <span className="block md:inline">Mausa</span>
      </h1>
      <div className="flex flex-col gap-6">
        <p className="max-w-[34ch] text-lg text-bone md:text-2xl">{t('positioning')}</p>
        <HeroPrompt locale={locale} />
      </div>
    </section>
  );
}
