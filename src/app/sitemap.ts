import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { HTML_LANG, LOCALES, localePath } from '@/i18n/locales';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', ...projects.map((p) => `/trabalho/${p.slug}`)];
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}${localePath(locale, path)}`,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `${SITE_URL}${localePath(l, path)}`])),
      },
    })),
  );
}
