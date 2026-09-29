import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';
import { ogImage } from '@/lib/metadata';

const png = (locale: 'pt' | 'en') => readFileSync(new URL(`../../public/og/${locale}.png`, import.meta.url));

describe('imagem de Open Graph estática', () => {
  it('ogImage aponta para o PNG do idioma, 1200×630', () => {
    expect(ogImage('pt')).toEqual({ url: '/og/pt.png', width: 1200, height: 630, alt: 'Lucas Casa Mausa' });
    expect(ogImage('en').url).toBe('/og/en.png');
  });

  it('os PNGs existem e têm 1200×630', () => {
    for (const locale of ['pt', 'en'] as const) {
      const buf = png(locale);
      expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      // IHDR: largura e altura em big-endian logo depois da assinatura e do cabeçalho do chunk.
      expect(buf.readUInt32BE(16)).toBe(1200);
      expect(buf.readUInt32BE(20)).toBe(630);
    }
  });

  it('os PNGs foram gerados com o texto atual do hero (rode `npm run og` se mudar o posicionamento)', () => {
    const inputs = JSON.parse(readFileSync(new URL('../../scripts/og-inputs.json', import.meta.url), 'utf8'));
    expect(inputs).toEqual({ pt: pt.hero.positioning, en: en.hero.positioning });
  });
});
