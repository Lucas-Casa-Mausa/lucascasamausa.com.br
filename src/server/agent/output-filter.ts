import type { Locale } from '@/i18n/locales';

const MARK = { pt: '[sob consulta]', en: '[on request]' } as const;
const BLOCKED = '[…]';

// Peças do reconhecimento de valores. Tudo roda sobre texto em NFKC (dígitos fullwidth viram ASCII).
const CUR = String.raw`(?:R\$|US\$|\$|€|£|BRL|USD|EUR|GBP)`;
const NUM = String.raw`\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?`;
const WORD = String.raw`(?:uma?|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte|trinta|quarenta|cinquenta|cem|cento|duzentos|trezentos|quinhentos|mil|one|two|three|five|ten|twenty|fifty|hundred|thousand)`;
const WORDS = String.raw`${WORD}(?:\s+(?:e\s+)?${WORD})*`;
const MULT = String.raw`(?:\s*(?:mil|milh(?:ão|ões)|mi|bi|k|m|mm)(?![\p{L}\d]))?`;
const UNIT = String.raw`(?:${CUR}|reais|real|d[oó]lares|dollars|bucks|contos|pila)`;

const MONEY = new RegExp(
  [
    String.raw`${CUR}\s*(?:${NUM}|${WORDS})${MULT}`, // R$ 5.000 · USD 5,000 · R$ cinco mil · US$ 1.5M
    String.raw`(?<![\p{L}\d])(?:${NUM}|${WORDS})${MULT}\s*${UNIT}(?![\p{L}])`, // 5000 BRL · 5.000 R$ · dez mil reais · 10 contos
    String.raw`(?<![\p{L}\d])(?:entre\s+)?${NUM}\s*(?:e|a|-)\s*${NUM}\s*mil(?![\p{L}])`, // entre 5 e 10 mil
    String.raw`(?<![\p{L}\d])${NUM}\s*mil(?![\p{L}])`, // uns 5 mil
    String.raw`(?<![\p{L}\d])${NUM}\s?k(?![\p{L}\d])`, // 2k
  ].join('|'),
  'giu',
);

// Fim de texto que pode ser o começo de um valor (símbolo/código ou número ainda sem unidade).
const OPEN_TAIL = new RegExp(String.raw`(?:${CUR}\s*|${NUM}\s*|(?<![\p{L}])${WORD}\s*)$`, 'iu');

/** Minúsculas e sem acento, com mapa para o índice do texto original (caractere a caractere). */
function foldWithMap(text: string): { folded: string; map: number[] } {
  let folded = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = text[i].normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    for (let k = 0; k < f.length; k++) {
      folded += f[k];
      map.push(i);
    }
  }
  return { folded, map };
}

const fold = (s: string) => foldWithMap(s).folded;

function termRanges(text: string, denylist: string[]): [number, number][] {
  const terms = denylist.map(fold).filter(Boolean);
  if (terms.length === 0) return [];
  const { folded, map } = foldWithMap(text);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let i = folded.indexOf(term);
    while (i !== -1) {
      ranges.push([map[i], map[i + term.length - 1] + 1]);
      i = folded.indexOf(term, i + term.length);
    }
  }
  return ranges;
}

export function redact(text: string, locale: Locale, denylist: string[]): string {
  let out = text.normalize('NFKC').replace(MONEY, MARK[locale]);
  const ranges = termRanges(out, denylist).sort((a, b) => b[0] - a[0]);
  for (const [a, b] of ranges) out = out.slice(0, a) + BLOCKED + out.slice(b);
  return out;
}

/**
 * Filtro para streaming: segura uma janela no fim do buffer e só libera até um espaço que (a) não corte um
 * valor ou termo proibido ao meio e (b) não deixe o texto liberado terminando em algo que possa começar um valor.
 */
export function createRedactor(locale: Locale, denylist: string[], window = 32) {
  let buffer = '';

  const safeCut = (): number => {
    let cut = buffer.lastIndexOf(' ', buffer.length - window);
    const spans: [number, number][] = [
      ...[...buffer.matchAll(MONEY)].map((m) => [m.index, m.index + m[0].length] as [number, number]),
      ...termRanges(buffer, denylist),
    ];
    while (cut > 0) {
      const head = buffer.slice(0, cut + 1);
      const crosses = spans.some(([a, b]) => a <= cut && cut < b);
      if (!crosses && !OPEN_TAIL.test(head.trimEnd() + ' ') && !OPEN_TAIL.test(head)) return cut;
      cut = buffer.lastIndexOf(' ', cut - 1);
    }
    return -1;
  };

  return {
    push(chunk: string): string {
      buffer += chunk.normalize('NFKC');
      if (buffer.length <= window) return '';
      const cut = safeCut();
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
