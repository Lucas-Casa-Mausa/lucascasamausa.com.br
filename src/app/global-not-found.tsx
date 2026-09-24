import type { Metadata } from 'next';
import Link from 'next/link';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

// 404 para URLs que não casam com nenhuma rota (fora de [locale]). O HTML completo é exigido aqui.
export const metadata: Metadata = {
  title: 'Rota não encontrada — Lucas Casa Mausa',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body className="font-sans antialiased">
        <main id="conteudo" className="grid-lines-dark flex min-h-svh flex-col justify-center px-4 md:px-8">
          <p className="font-mono text-sm text-amber">HTTP 404</p>
          <h1 className="mt-4 font-display text-[clamp(3rem,15vw,12rem)] leading-[0.85] tracking-[-0.04em] uppercase">
            Rota não encontrada
          </h1>
          <Link
            href="/"
            className="mt-10 inline-flex min-h-11 items-center self-start border-b-[1.5px] border-amber font-mono text-sm tracking-[0.06em] text-amber uppercase"
          >
            Voltar para o início →
          </Link>
        </main>
      </body>
    </html>
  );
}
