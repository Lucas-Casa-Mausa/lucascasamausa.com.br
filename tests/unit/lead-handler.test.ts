import { describe, expect, it, vi } from 'vitest';
import { createMemoryStore } from '@/server/agent/limits';
import { handleLeadRequest, type LeadDeps } from '@/server/lead/handler';

const valid = { locale: 'pt', name: 'Ana Souza', email: 'ana@example.com', company: 'Clínica X', consent: true, summary: 'Agenda + WhatsApp, 10–18 semanas' };
const post = (b: unknown) =>
  new Request('http://x/api/lead', { method: 'POST', body: JSON.stringify(b), headers: { 'x-forwarded-for': '9.9.9.9' } });
const deps = (over: Partial<LeadDeps> = {}): LeadDeps => ({
  store: createMemoryStore(),
  now: () => new Date('2026-09-24T10:00:00Z'),
  send: vi.fn(async () => {}),
  ...over,
});

describe('/api/lead', () => {
  it('envia o e-mail com resumo e reply-to do visitante', async () => {
    const d = deps();
    const res = await handleLeadRequest(post(valid), d);
    expect(res.status).toBe(200);
    expect(d.send).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'ana@example.com', subject: expect.stringContaining('Ana Souza') }),
    );
    const mail = (d.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(mail.text).toContain('Agenda + WhatsApp');
  });

  it('400 sem consentimento', async () => {
    expect((await handleLeadRequest(post({ ...valid, consent: false }), deps())).status).toBe(400);
  });

  it('400 com e-mail inválido', async () => {
    expect((await handleLeadRequest(post({ ...valid, email: 'nao-e-email' }), deps())).status).toBe(400);
  });

  it('429 no sexto lead do dia pelo mesmo IP', async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) expect((await handleLeadRequest(post(valid), d)).status).toBe(200);
    expect((await handleLeadRequest(post(valid), d)).status).toBe(429);
  });

  it('502 quando o envio falha', async () => {
    const res = await handleLeadRequest(post(valid), deps({ send: async () => { throw new Error('down'); } }));
    expect(res.status).toBe(502);
  });

  it('revisão I5: CR/LF no nome não vira quebra no assunto', async () => {
    const d = deps();
    await handleLeadRequest(post({ ...valid, name: 'Ana\r\nBcc: x@evil.com' }), d);
    const mail = (d.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it('revisão I5: teto global diário de leads', async () => {
    const d = deps({ globalDailyCap: 2 });
    const ip = (n: number) => new Request('http://x/api/lead', { method: 'POST', body: JSON.stringify(valid), headers: { 'x-forwarded-for': `9.9.9.${n}` } });
    expect((await handleLeadRequest(ip(1), d)).status).toBe(200);
    expect((await handleLeadRequest(ip(2), d)).status).toBe(200);
    expect((await handleLeadRequest(ip(3), d)).status).toBe(429);
  });

  it('revisão I5: com segredo de sessão, lead sem cookie nem token → 403', async () => {
    const d = deps({ sessionSecret: 's', verifyTurnstile: async () => false });
    expect((await handleLeadRequest(post(valid), d)).status).toBe(403);
  });

  it('revisão I5: falha no envio não consome o limite do IP', async () => {
    const failing = deps({ send: async () => { throw new Error('down'); } });
    for (let i = 0; i < 6; i++) expect((await handleLeadRequest(post(valid), failing)).status).toBe(502);
  });
});
