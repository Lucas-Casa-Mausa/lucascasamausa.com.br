// Gera as imagens de Open Graph estáticas (public/og/{pt,en}.png).
// Estáticas de propósito: a rota dinâmica com next/og colocava o renderizador e a fonte dentro do Worker
// e passava do limite de tamanho do plano grátis da Cloudflare. Rode `npm run og` ao mudar hero.positioning.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ImageResponse } from 'next/og.js';
import { createElement as h } from 'react';

const LOCALES = ['pt', 'en'];
const root = new URL('..', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

function card(positioning) {
  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b0b0a',
        color: '#efe9dc',
        padding: 64,
      },
    },
    h('div', { style: { display: 'flex', fontSize: 24, color: '#9a9486', letterSpacing: 4 } }, 'LUCASCASAMAUSA.COM.BR'),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', fontSize: 150, fontWeight: 900, lineHeight: 0.85, letterSpacing: -6 } },
      h('span', null, 'LUCAS'),
      h('span', null, 'CASA MAUSA'),
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 24 } },
      h('div', { style: { width: 120, height: 4, background: '#ffb000' } }),
      h('div', { style: { display: 'flex', fontSize: 30, maxWidth: 900 } }, positioning),
    ),
  );
}

mkdirSync(new URL('public/og/', root), { recursive: true });
const inputs = {};
for (const locale of LOCALES) {
  const positioning = read(`messages/${locale}.json`).hero.positioning;
  const image = new ImageResponse(card(positioning), { width: 1200, height: 630 });
  writeFileSync(new URL(`public/og/${locale}.png`, root), Buffer.from(await image.arrayBuffer()));
  inputs[locale] = positioning;
}
// O teste unitário compara isto com as mensagens atuais: falha se o texto mudou e as imagens não.
writeFileSync(new URL('scripts/og-inputs.json', root), `${JSON.stringify(inputs, null, 2)}\n`);
console.log('og: public/og/pt.png, public/og/en.png');
