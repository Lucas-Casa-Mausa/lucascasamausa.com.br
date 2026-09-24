import { localePath, type Locale } from '@/i18n/locales';

export function buildAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      'pt-BR': localePath('pt', path),
      en: localePath('en', path),
      'x-default': localePath('pt', path),
    },
  };
}
