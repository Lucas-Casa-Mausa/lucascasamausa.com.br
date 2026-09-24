import { describe, expect, it } from 'vitest';
import { labItems } from '@/content/lab';
import { DIAGRAM_VIEWBOX, getProject, projects } from '@/content/projects';
import { LOCALES } from '@/i18n/locales';

// IBM Plex Mono a 9px: largura média ~0,6em por caractere.
const labelWidth = (label: string) => label.length * 9 * 0.6;

describe('projetos', () => {
  it('estão na ordem das pranchas 01..05 e 00 (o agente) por último', () => {
    expect(projects.map((p) => p.plate)).toEqual(['01', '02', '03', '04', '05', '00']);
    expect(projects.map((p) => p.slug)).toEqual([
      'creditpulse-ai',
      'fast-semantic-cache',
      'threads',
      'kiwibit',
      'plataforma-financeira',
      'agente',
    ]);
  });

  it('a prancha 00 abre o agente', () => {
    expect(getProject('agente')?.action).toBe('try-agent');
    expect(getProject('agente')?.links).toEqual([]);
  });

  it('slugs são únicos e em kebab-case minúsculo', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('todo texto localizado existe e não é vazio nos dois idiomas', () => {
    for (const p of projects) {
      for (const locale of LOCALES) {
        for (const field of [p.tagline, p.problem, p.solution]) expect(field[locale].trim(), p.slug).not.toBe('');
        expect(p.decisions[locale].length, p.slug).toBeGreaterThan(0);
        expect(p.decisions[locale].length, p.slug).toBe(p.decisions.pt.length);
      }
    }
  });

  it('diagramas: arestas apontam para nós existentes e nós cabem no viewBox', () => {
    for (const p of projects) {
      const ids = new Set(p.diagram.nodes.map((n) => n.id));
      for (const e of p.diagram.edges) {
        expect(ids.has(e.from), `${p.slug}: ${e.from}`).toBe(true);
        expect(ids.has(e.to), `${p.slug}: ${e.to}`).toBe(true);
      }
      for (const n of p.diagram.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeGreaterThanOrEqual(8); // espaço para o rótulo de camada acima do nó
        expect(n.x + n.w, `${p.slug}/${n.id}`).toBeLessThanOrEqual(DIAGRAM_VIEWBOX.w);
        expect(n.y + n.h, `${p.slug}/${n.id}`).toBeLessThanOrEqual(DIAGRAM_VIEWBOX.h);
      }
    }
  });

  it('rótulos dos nós cabem na caixa nos dois idiomas', () => {
    for (const p of projects) {
      for (const n of p.diagram.nodes) {
        for (const locale of LOCALES) {
          expect(labelWidth(n.label[locale]), `${p.slug}/${n.id}/${locale}`).toBeLessThanOrEqual(n.w - 8);
        }
      }
    }
  });

  it('confidencial não tem links; repositórios privados não mostram código', () => {
    expect(getProject('plataforma-financeira')?.badge).toBe('confidential');
    expect(getProject('plataforma-financeira')?.links).toEqual([]);
    for (const slug of ['creditpulse-ai', 'fast-semantic-cache']) {
      expect(getProject(slug)?.links.some((l) => l.kind === 'repo')).toBe(false);
    }
  });

  it('kiwibit é colaboração com código e site no ar', () => {
    const kiwibit = getProject('kiwibit');
    expect(kiwibit?.badge).toBe('collaboration');
    expect(kiwibit?.links.map((l) => l.kind).sort()).toEqual(['live', 'repo']);
  });

  it('getProject é sensível a caixa e devolve undefined para desconhecido', () => {
    expect(getProject('CreditPulse-AI')).toBeUndefined();
    expect(getProject('nao-existe')).toBeUndefined();
  });

  it('links são https', () => {
    for (const p of projects) for (const l of p.links) expect(l.href).toMatch(/^https:\/\//);
    for (const item of labItems) if (item.href) expect(item.href).toMatch(/^https:\/\//);
  });
});

describe('laboratório', () => {
  it('tem gobalance, vulnlab e copilot-agents com descrição nos dois idiomas', () => {
    expect(labItems.map((i) => i.name)).toEqual(['gobalance', 'vulnlab', 'copilot-agents']);
    for (const item of labItems) for (const locale of LOCALES) expect(item.description[locale].trim()).not.toBe('');
  });
});
