import type { Locale } from '@/i18n/locales';

const MARK = { pt: '[sob consulta]', en: '[on request]' } as const;
const BLOCKED = '[…]';

// Valores monetários: símbolo + número, número + "reais/mil reais/dólares/dollars", ou "2k". Não pega prazos.
// Número: separadores só contam se seguidos de dígito (não engole o ponto final da frase).
const MONEY =
  /(?:R\$|US\$|€|£|\$)\s?\d+(?:[.,]\d+)*(?:\s?(?:mil|k)\b)?|\b\d+(?:[.,]\d+)*\s?(?:mil\s)?(?:reais|dólares|dolares|dollars|bucks)\b|\b\d+(?:[.,]\d+)?\s?k\b/gi;

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function redact(text: string, locale: Locale, denylist: string[]): string {
  let out = text.replace(MONEY, MARK[locale]);
  const terms = denylist.map(fold).filter(Boolean);
  if (terms.length === 0) return out;
  // Troca termos proibidos preservando o resto do texto (compara sem acento/caixa).
  const folded = fold(out);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let i = folded.indexOf(term);
    while (i !== -1) {
      ranges.push([i, i + term.length]);
      i = folded.indexOf(term, i + term.length);
    }
  }
  ranges.sort((a, b) => b[0] - a[0]);
  for (const [a, b] of ranges) out = out.slice(0, a) + BLOCKED + out.slice(b);
  return out;
}

/**
 * Filtro para streaming: segura uma janela no fim do buffer para pegar padrões quebrados entre pedaços.
 * Só libera texto até o último espaço fora da janela, então nada sai "pela metade".
 */
export function createRedactor(locale: Locale, denylist: string[], window = 32) {
  let buffer = '';
  return {
    push(chunk: string): string {
      buffer += chunk;
      if (buffer.length <= window) return '';
      const cut = buffer.lastIndexOf(' ', buffer.length - window);
      if (cut <= 0) return '';
      const ready = redact(buffer.slice(0, cut + 1), locale, denylist);
      buffer = buffer.slice(cut + 1);
      return ready;
    },
    flush(): string {
      const rest = redact(buffer, locale, denylist);
      buffer = '';
      return rest;
    },
  };
}
