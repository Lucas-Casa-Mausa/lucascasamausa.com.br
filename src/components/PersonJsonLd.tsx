import { PERSON, SITE_URL } from '@/lib/site';

export function PersonJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSON.name,
    url: SITE_URL,
    jobTitle: PERSON.jobTitle,
    address: { '@type': 'PostalAddress', addressLocality: PERSON.city, addressCountry: 'BR' },
    sameAs: [PERSON.linkedin, PERSON.github],
  };
  // Conteúdo estático do próprio repo; sem entrada de usuário.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
