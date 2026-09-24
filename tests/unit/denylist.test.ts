import { describe, expect, it } from 'vitest';
import { findHits, normalize, parseDenylist } from '../../scripts/denylist.mjs';

// Termos fictícios: nunca coloque aqui nome real de empresa, cliente, parceiro ou banco.
describe('denylist', () => {
  it('normaliza caixa e acentos', () => {
    expect(normalize('AçaíZeiro')).toBe('acaizeiro');
    expect(normalize('ÁRVORE')).toBe('arvore');
  });

  it('parseDenylist ignora vazios e espaços', () => {
    expect(parseDenylist(' Foo , ,Bár ')).toEqual(['foo', 'bar']);
    expect(parseDenylist(undefined)).toEqual([]);
    expect(parseDenylist('')).toEqual([]);
  });

  it('parseDenylist aceita um termo por linha (formato natural do secret no GitHub)', () => {
    expect(parseDenylist('acme\nAçaízeiro\r\n\nzeta, omega')).toEqual(['acme', 'acaizeiro', 'zeta', 'omega']);
  });

  it('acha termo com outra caixa ou acentuação', () => {
    const terms = parseDenylist('acme,acaizeiro');
    expect(findHits('Trabalho na ACME desde 2020', terms)).toEqual(['acme']);
    expect(findHits('Integração com o Açaízeiro', terms)).toEqual(['acaizeiro']);
  });

  it('não acusa texto limpo', () => {
    expect(findHits('Plataforma financeira multi-organização', parseDenylist('acme,acaizeiro'))).toEqual([]);
  });
});
