import { localePath, type Locale } from '@/i18n/locales';
import { PERSON } from '@/lib/site';

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

/** Prévia de compartilhamento: PNG estático por idioma (gerado por `npm run og`, não por rota dinâmica). */
export function ogImage(locale: Locale) {
  return { url: `/og/${locale}.png`, width: 1200, height: 630, alt: PERSON.name };
}
