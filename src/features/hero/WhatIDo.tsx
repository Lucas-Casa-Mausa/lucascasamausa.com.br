import { getTranslations } from 'next-intl/server';

const ITEMS = ['products', 'ai', 'base'] as const;

export async function WhatIDo() {
  const t = await getTranslations('whatIDo');
  return (
    <section aria-labelledby="what-title" className="border-t border-line-dark">
      <h2 id="what-title" className="sr-only">
        {t('heading')}
      </h2>
      <div className="mx-auto grid max-w-[1440px] md:grid-cols-3">
        {ITEMS.map((key, i) => (
          <div key={key} className="border-b border-line-dark px-4 py-6 md:border-r md:border-b-0 md:px-8 md:last:border-r-0">
            <p className="font-mono text-[11px] tracking-[0.08em] text-amber uppercase">
              {String(i + 1).padStart(2, '0')} —
            </p>
            <h3 className="mt-2 text-xl font-medium text-bone">{t(`${key}.title`)}</h3>
            <p className="mt-2 max-w-[36ch] text-muted">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
