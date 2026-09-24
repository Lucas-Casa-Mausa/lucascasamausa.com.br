import { describe, expect, it } from 'vitest';
import { buildAlternates } from '@/lib/metadata';

describe('buildAlternates', () => {
  it('home em pt', () => {
    expect(buildAlternates('pt', '/')).toEqual({
      canonical: '/',
      languages: { 'pt-BR': '/', en: '/en', 'x-default': '/' },
    });
  });

  it('caso em en', () => {
    expect(buildAlternates('en', '/trabalho/threads')).toEqual({
      canonical: '/en/trabalho/threads',
      languages: { 'pt-BR': '/trabalho/threads', en: '/en/trabalho/threads', 'x-default': '/trabalho/threads' },
    });
  });
});
