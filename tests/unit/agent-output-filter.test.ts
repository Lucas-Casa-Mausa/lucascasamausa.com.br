import { describe, expect, it } from 'vitest';
import { createRedactor, redact } from '@/server/agent/output-filter';

const deny = ['acme'];

describe('filtro de saída', () => {
  it('remove valores monetários (pt e en)', () => {
    expect(redact('Fica em torno de R$ 5.000 no total.', 'pt', deny)).toBe('Fica em torno de [sob consulta] no total.');
    expect(redact('About $4,500 or US$ 900.', 'en', deny)).toBe('About [on request] or [on request].');
    expect(redact('uns 8 mil reais', 'pt', deny)).toBe('uns [sob consulta]');
    expect(redact('cerca de 2k', 'pt', deny)).toBe('cerca de [sob consulta]');
  });

  it('não toca em prazos, números comuns nem na palavra preço', () => {
    const ok = 'Estimativa inicial de 4 a 6 semanas, 3 integrações. Preço: o Lucas passa depois.';
    expect(redact(ok, 'pt', deny)).toBe(ok);
  });

  it('remove termos da denylist, ignorando caixa e acento', () => {
    expect(redact('Trabalhei na ACME e na Ácme.', 'pt', deny)).toBe('Trabalhei na […] e na […].');
  });

  it('streaming: pega valor quebrado entre pedaços', () => {
    const r = createRedactor('pt', deny);
    const out = ['Custa R', '$ 5.', '000 ao todo'].map((c) => r.push(c)).join('') + r.flush();
    expect(out).toBe('Custa [sob consulta] ao todo');
  });

  it('streaming: pega termo proibido quebrado entre pedaços', () => {
    const r = createRedactor('pt', deny);
    const out = ['na AC', 'ME hoje'].map((c) => r.push(c)).join('') + r.flush();
    expect(out).toBe('na […] hoje');
  });

  it('streaming sem nada a filtrar devolve o texto intacto', () => {
    const r = createRedactor('en', deny);
    const text = 'Hello there, this is fine.';
    const out = text.split(/(?<=\s)/).map((c) => r.push(c)).join('') + r.flush();
    expect(out).toBe(text);
  });

  it('revisão: formatos de valor que escapavam (I1)', () => {
    const cases = [
      'R$  5000', 'R$ 5 000', 'BRL 5000', '5000 BRL', 'USD 5,000', 'EUR 300', '5.000 R$', 'R$ ５０００',
      'cinco mil reais', 'dez mil reais', 'R$ cinco mil', 'uns 5 mil', 'entre 5 e 10 mil', '10 contos',
      'US$ 1.5M', '5k reais',
    ];
    for (const c of cases) {
      const out = redact(`valor: ${c} ok`, 'pt', deny);
      expect(out, c).not.toMatch(/\d|[０-９]|mil|reais|contos|BRL|USD|EUR/i);
      expect(out, c).toContain('[sob consulta]');
    }
  });

  it('revisão: prazos continuam intactos', () => {
    for (const ok of ['de 4 a 6 semanas', 'entre 10 e 18 semanas', '3 integrações', 'versão 2', 'em 2026']) {
      expect(redact(ok, 'pt', deny), ok).toBe(ok);
    }
  });

  it('revisão: streaming não vaza valor cortado logo depois do símbolo ou do número (I1)', () => {
    const run = (chunks: string[]) => {
      const r = createRedactor('pt', deny);
      return chunks.map((c) => r.push(c)).join('') + r.flush();
    };
    expect(run(['O valor é R$ ', '5000,00/mês-negociável-conforme-escopo-final-do-projeto', ' ok'])).not.toMatch(/5000/);
    expect(run(['Fica em 5000 ', 'reais/mês-negociável-conforme-escopo-final-do-projeto', ' ok'])).not.toMatch(/5000/);
  });

  it('revisão: termo proibido depois de acentos decompostos sai inteiro (I3)', () => {
    const decomposed = 'e\u0301'.repeat(6);
    const out = redact(`${decomposed} trabalhei na ACME hoje`, 'pt', deny);
    expect(out).not.toMatch(/acme|cme|acm/i);
    expect(out).toContain('[…]');
  });
});
