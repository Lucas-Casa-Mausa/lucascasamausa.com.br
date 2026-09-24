import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  // Sem redirecionar pelo Accept-Language: PT é o padrão e o visitante escolhe EN no seletor.
  localeDetection: false,
});
