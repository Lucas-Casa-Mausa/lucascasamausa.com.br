import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Nav } from '@/components/Nav';
import { localePath } from '@/i18n/locales';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');
  return (
    <>
      <Nav locale={locale} path="/" />
      <main id="conteudo" className="grid-lines-dark flex min-h-[80svh] flex-col justify-center px-4 md:px-8">
        <p className="font-mono text-sm text-amber">HTTP 404</p>
        <h1 className="mt-4 font-display text-[clamp(3.5rem,16vw,12rem)] leading-[0.85] tracking-[-0.04em] uppercase">
          {t('title')}
        </h1>
        <p className="mt-6 max-w-[40ch] text-lg">{t('body')}</p>
        <Link href={localePath(locale, '/')} className="mt-10 inline-flex min-h-11 items-center self-start border-b-[1.5px] border-amber font-mono text-sm tracking-[0.06em] text-amber uppercase">
          {t('back')} →
        </Link>
      </main>
    </>
  );
}
