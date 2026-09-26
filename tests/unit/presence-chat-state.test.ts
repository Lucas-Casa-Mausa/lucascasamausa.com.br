import { describe, expect, it } from 'vitest';
import { presenceFromChat, pulseAmp } from '@/features/agent/presence/chat-state';

const user = (text: string) => ({ role: 'user', parts: [{ type: 'text', text }] });
const bot = (...parts: { type: string; state?: string; text?: string }[]) => ({ role: 'assistant', parts });

describe('presenceFromChat', () => {
  it('enviado e sem resposta ainda: pensando', () => {
    expect(presenceFromChat('submitted', [user('oi')], { len: 0, status: 'ready' })).toMatchObject({ state: 'thinking', delta: 0, tool: false });
  });

  it('primeira leitura nunca pulsa', () => {
    const r = presenceFromChat('ready', [user('oi'), bot({ type: 'text', text: 'Olá!' })], null);
    expect(r).toMatchObject({ state: 'idle', delta: 0, textLen: 4 });
  });

  it('histórico restaurado com o chat parado não pulsa', () => {
    const r = presenceFromChat('ready', [user('oi'), bot({ type: 'text', text: 'Olá, tudo bem?' })], { len: 0, status: 'ready' });
    expect(r).toMatchObject({ state: 'idle', delta: 0, textLen: 14 });
  });

  it('texto chegando no streaming: falando, com o tamanho do delta', () => {
    const r = presenceFromChat('streaming', [user('oi'), bot({ type: 'text', text: 'Olá, tudo' })], { len: 4, status: 'streaming' });
    expect(r).toMatchObject({ state: 'speaking', delta: 5 });
  });

  it('último delta junto com o ready ainda conta como fala', () => {
    const r = presenceFromChat('ready', [user('oi'), bot({ type: 'text', text: 'Olá!' })], { len: 0, status: 'submitted' });
    expect(r).toMatchObject({ state: 'speaking', delta: 4 });
  });

  it('ferramenta em andamento: pensando, com tool=true', () => {
    const r = presenceFromChat('streaming', [user('clínica'), bot({ type: 'tool-update_scope', state: 'input-available' })], { len: 0, status: 'submitted' });
    expect(r).toMatchObject({ state: 'thinking', tool: true });
  });

  it('ferramenta concluída e chat parado: repouso', () => {
    const r = presenceFromChat('ready', [user('clínica'), bot({ type: 'tool-update_scope', state: 'output-available' })], { len: 0, status: 'ready' });
    expect(r).toMatchObject({ state: 'idle', tool: false });
  });

  it('erro: repouso', () => {
    expect(presenceFromChat('error', [user('erro')], { len: 0, status: 'submitted' }).state).toBe('idle');
  });

  it('texto que encolhe (setMessages) não gera delta negativo', () => {
    expect(presenceFromChat('streaming', [], { len: 50, status: 'streaming' }).delta).toBe(0);
  });

  it('pulseAmp fica entre 0,55 e 0,95', () => {
    expect(pulseAmp(1)).toBeGreaterThanOrEqual(0.55);
    expect(pulseAmp(1)).toBeLessThan(0.6);
    expect(pulseAmp(100000)).toBe(0.95);
  });
});
