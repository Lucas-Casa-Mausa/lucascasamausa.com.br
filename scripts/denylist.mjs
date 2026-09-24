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

const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordChar = (c) => /[a-z0-9]/.test(c);

/**
 * Termos da lista que aparecem no texto (após normalizar). Um termo que começa/termina com letra ou dígito
 * não pode estar colado a outra letra/dígito nesse lado — evita falso positivo dentro de identificadores
 * de bibliotecas (ex.: um termo curto no meio de "commitAudio"), sem perder "Termo", "TERMO" ou "termo-123".
 */
export function findHits(text, terms) {
  const haystack = normalize(text);
  return terms.filter((t) => {
    const before = isWordChar(t[0]) ? '(?<![a-z0-9])' : '';
    const after = isWordChar(t[t.length - 1]) ? '(?![a-z0-9])' : '';
    return new RegExp(before + escape(t) + after).test(haystack);
  });
}
