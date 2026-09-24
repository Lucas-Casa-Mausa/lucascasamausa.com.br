export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt';

export const HTML_LANG: Record<Locale, string> = { pt: 'pt-BR', en: 'en' };
export const OG_LOCALE: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Caminho público de uma rota no idioma dado. PT não leva prefixo (localePrefix: 'as-needed'). */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith('/')) throw new Error(`path must start with "/": ${path}`);
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
