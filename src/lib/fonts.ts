import { Archivo, Archivo_Narrow, IBM_Plex_Mono, Newsreader } from 'next/font/google';

// Só os pesos usados. Archivo (texto) e Archivo Narrow (display) são críticos para o LCP e ficam com preload;
// mono e serifa aparecem em rótulos e citações, então carregam sem competir pelo caminho crítico.
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-archivo', display: 'swap' });
const archivoNarrow = Archivo_Narrow({ subsets: ['latin'], weight: ['700'], variable: '--font-archivo-narrow', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-plex-mono', display: 'swap', preload: false });
const newsreader = Newsreader({ subsets: ['latin'], style: ['italic'], weight: ['400'], variable: '--font-newsreader', display: 'swap', preload: false });

export const fontVariables = [archivo.variable, archivoNarrow.variable, plexMono.variable, newsreader.variable].join(' ');
