import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, KNOWLEDGE } from '@/server/agent/knowledge';
import { projects } from '@/content/projects';

describe('conhecimento do agente', () => {
  it('cita todos os projetos públicos pelo título', () => {
    for (const p of projects) expect(KNOWLEDGE).toContain(p.title);
  });

  it('o system prompt carrega as regras fixas', () => {
    const pt = buildSystemPrompt('pt');
    expect(pt).toMatch(/nunca/i);
    expect(pt).toMatch(/pre[cç]o/i);
    expect(pt).toContain('update_scope');
    expect(pt).toContain('request_contact');
    expect(buildSystemPrompt('en')).toMatch(/English/);
  });

  it('é estável (sem data, hora ou valores aleatórios) para o cache de prompt', () => {
    expect(buildSystemPrompt('pt')).toBe(buildSystemPrompt('pt'));
  });
});
