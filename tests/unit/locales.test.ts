import { describe, expect, it } from 'vitest';
import { HTML_LANG, isLocale, LOCALES, localePath } from '@/i18n/locales';

describe('locales', () => {
  it('pt é o primeiro e padrão; en existe', () => {
    expect(LOCALES).toEqual(['pt', 'en']);
    expect(HTML_LANG).toEqual({ pt: 'pt-BR', en: 'en' });
  });

  it('isLocale aceita só pt e en', () => {
    expect(isLocale('pt')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('es')).toBe(false);
    expect(isLocale('PT')).toBe(false);
  });

  it('localePath não prefixa o idioma padrão', () => {
    expect(localePath('pt', '/')).toBe('/');
    expect(localePath('pt', '/trabalho/threads')).toBe('/trabalho/threads');
  });

  it('localePath prefixa en', () => {
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('en', '/trabalho/threads')).toBe('/en/trabalho/threads');
  });

  it('localePath rejeita caminho sem barra inicial', () => {
    expect(() => localePath('en', 'trabalho')).toThrow();
  });
});
