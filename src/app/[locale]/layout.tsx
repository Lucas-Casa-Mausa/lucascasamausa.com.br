import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SkipLink } from '@/components/SkipLink';
import { HTML_LANG, LOCALES, OG_LOCALE } from '@/i18n/locales';
import { resolveLocale } from '@/i18n/resolve-locale';
import { fontVariables } from '@/lib/fonts';
import { buildAlternates } from '@/lib/metadata';
import { PERSON, SITE_URL } from '@/lib/site';
import '../globals.css';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// Só pt e en existem; qualquer outro valor é 404 sem gerar cache em disco.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(locale, '/'),
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      siteName: PERSON.name,
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <html lang={HTML_LANG[locale]} className={fontVariables}>
      <body className="font-sans antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
