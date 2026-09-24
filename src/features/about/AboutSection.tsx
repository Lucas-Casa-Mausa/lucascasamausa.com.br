import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ABOUT_PHOTO } from '@/lib/site';
import { Monogram } from './Monogram';

const PRINCIPLES = ['spec', 'measure', 'ai'] as const;

export async function AboutSection() {
  const t = await getTranslations('about');
  return (
    <section id="sobre" aria-labelledby="about-title" className="border-t border-line-dark px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-12">
        <figure className="grain w-full max-w-[400px] self-start md:col-span-5">
          {ABOUT_PHOTO ? (
            <Image
              src={ABOUT_PHOTO.src}
              width={ABOUT_PHOTO.width}
              height={ABOUT_PHOTO.height}
              alt={t('photoAlt')}
              sizes="(min-width: 768px) 400px, 100vw"
              className="h-auto w-full contrast-125 grayscale"
            />
          ) : (
            <Monogram label={t('photoAlt')} />
          )}
        </figure>
        <div className="md:col-span-7">
          <h2 id="about-title" className="font-display text-[clamp(3rem,12vw,8rem)] leading-[0.85] tracking-[-0.03em] uppercase">
            {t('heading')}
          </h2>
          <p className="mt-6 max-w-[60ch] text-lg text-bone">{t('body')}</p>
          <h3 className="mt-12 font-mono text-[11px] tracking-[0.08em] text-amber uppercase">{t('howIWork')}</h3>
          <ul className="mt-4 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map((key) => (
              <li key={key} className="border-t border-line-dark pt-4">
                <h4 className="text-lg font-medium text-bone">{t(`${key}.title`)}</h4>
                <p className="mt-2 text-muted">{t(`${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
