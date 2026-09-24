import { getTranslations } from 'next-intl/server';
import { PERSON } from '@/lib/site';

export async function ContactSection() {
  const t = await getTranslations('contact');
  const links = [
    { label: t('email'), value: PERSON.email, href: `mailto:${PERSON.email}` },
    { label: t('linkedin'), value: 'lucas-casa-mausa', href: PERSON.linkedin },
    { label: t('github'), value: 'Lucas-Casa-Mausa', href: PERSON.github },
  ];
  return (
    <section id="contato" aria-labelledby="contact-title" className="grid-lines-dark border-t border-line-dark px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1440px]">
        <h2 id="contact-title" className="font-display text-[clamp(3.5rem,14vw,10rem)] leading-[0.85] tracking-[-0.04em] uppercase">
          {t('heading')}
        </h2>
        <p className="mt-6 font-serif text-2xl italic">{t('body')}</p>
        <ul className="mt-10 flex flex-col border-b border-line-dark">
          {links.map((l) => (
            <li key={l.href} className="border-t border-line-dark">
              <a
                href={l.href}
                {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex min-h-14 flex-wrap items-baseline justify-between gap-2 py-4 hover:text-amber"
              >
                <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{l.label}</span>
                <span className="text-lg text-bone [overflow-wrap:anywhere] md:text-2xl">{l.value} ↗</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-16 font-mono text-[11px] text-muted">© {new Date().getFullYear()} {PERSON.name}</p>
      </div>
    </section>
  );
}
