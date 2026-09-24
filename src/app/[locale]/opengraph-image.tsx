import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { resolveLocale } from '@/i18n/resolve-locale';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Lucas Casa Mausa';

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'hero' });
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0b0b0a',
          color: '#efe9dc',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', fontSize: 24, color: '#9a9486', letterSpacing: 4 }}>LUCASCASAMAUSA.COM.BR</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 150, fontWeight: 900, lineHeight: 0.85, letterSpacing: -6 }}>
          <span>LUCAS</span>
          <span>CASA MAUSA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 120, height: 4, background: '#ffb000' }} />
          <div style={{ display: 'flex', fontSize: 30, maxWidth: 900 }}>{t('positioning')}</div>
        </div>
      </div>
    ),
    size,
  );
}
