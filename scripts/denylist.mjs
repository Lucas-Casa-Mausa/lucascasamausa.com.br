/** Remove acentos e baixa a caixa, para comparar "Açaí" com "acai". */
export function normalize(s) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** "A, b\nC" → ["a","b","c"] (normalizados). Aceita vírgula ou quebra de linha. */
export function parseDenylist(raw) {
  return (raw ?? '')
    .split(/[,\r\n]/)
    .map((t) => normalize(t.trim()))
    .filter(Boolean);
}

/** Termos da lista que aparecem no texto (substring, após normalizar). */
export function findHits(text, terms) {
  const haystack = normalize(text);
  return terms.filter((t) => haystack.includes(t));
}
