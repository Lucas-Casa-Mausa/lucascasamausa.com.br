import type { Locale } from '@/i18n/locales';

export type Localized<T = string> = Record<Locale, T>;

/** Nó do diagrama de uma prancha. Coordenadas no viewBox 400×240. `layer` é usado pela explosão 3D (Plano 2). */
export type DiagramNode = {
  id: string;
  label: Localized;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: 0 | 1 | 2;
};

export type Diagram = {
  nodes: DiagramNode[];
  edges: { from: string; to: string }[];
};

export type ProjectLink = { kind: 'repo' | 'live'; href: string };

export type Project = {
  slug: string;
  plate: string;
  title: string;
  tagline: Localized;
  problem: Localized;
  solution: Localized;
  decisions: Localized<string[]>;
  stack: string[];
  links: ProjectLink[];
  badge?: 'collaboration' | 'confidential';
  /** Ação extra na prancha/caso (ex.: abrir o agente do próprio portfolio). */
  action?: 'try-agent';
  diagram: Diagram;
};

export type LabItem = {
  name: string;
  description: Localized;
  stack: string[];
  href?: string;
};
