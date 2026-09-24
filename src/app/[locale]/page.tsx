import { setRequestLocale } from 'next-intl/server';
import { Nav } from '@/components/Nav';
import { PersonJsonLd } from '@/components/PersonJsonLd';
import { Hero } from '@/features/hero/Hero';
import { WhatIDo } from '@/features/hero/WhatIDo';
import { AboutSection } from '@/features/about/AboutSection';
import { ContactSection } from '@/features/contact/ContactSection';
import { LabSection } from '@/features/lab/LabSection';
import { WorkSection } from '@/features/plates/WorkSection';
import { resolveLocale } from '@/i18n/resolve-locale';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <>
      <Nav locale={locale} path="/" />
      <main id="conteudo">
        <Hero />
        <WhatIDo />
        <WorkSection locale={locale} />
        <LabSection locale={locale} />
        <AboutSection />
        <ContactSection />
      </main>
      <PersonJsonLd />
    </>
  );
}
