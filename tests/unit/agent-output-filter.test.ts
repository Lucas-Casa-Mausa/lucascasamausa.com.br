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
});
