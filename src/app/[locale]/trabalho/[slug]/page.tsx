import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Nav } from '@/components/Nav';
import { getProject, projects } from '@/content/projects';
import { CaseStudy } from '@/features/case/CaseStudy';
import { localePath, OG_LOCALE } from '@/i18n/locales';
import { resolveLocale } from '@/i18n/resolve-locale';
import { buildAlternates } from '@/lib/metadata';
import { PERSON } from '@/lib/site';

type Props = { params: Promise<{ locale: string; slug: string }> };



// Slug desconhecido é 404 sem virar arquivo ISR (escrita em disco controlada por quem faz a requisição).
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const project = getProject(slug);
  if (!project) return {};
  const title = `${project.title} — ${PERSON.name}`;
  const description = project.tagline[locale];
  return {
    title,
    description,
    alternates: buildAlternates(locale, `/trabalho/${slug}`),
    openGraph: {
      type: 'article',
      locale: OG_LOCALE[locale],
      siteName: PERSON.name,
      title,
      description,
      // O openGraph do filho substitui o do pai inteiro; sem isto o caso fica sem prévia ao compartilhar.
      images: [{ url: localePath(locale, '/opengraph-image'), width: 1200, height: 630, alt: PERSON.name }],
    },
  };
}

export default async function CasePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  setRequestLocale(locale);
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <Nav locale={locale} path={`/trabalho/${slug}`} />
      <main id="conteudo" className="paper-grid min-h-screen bg-paper px-4 py-12 text-ink md:px-8">
        <CaseStudy project={project} locale={locale} />
      </main>
    </>
  );
}
