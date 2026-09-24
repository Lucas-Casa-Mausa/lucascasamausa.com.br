import { tool } from 'ai';
import { z } from 'zod';
import { getProject } from '@/content/projects';
import { localePath, type Locale } from '@/i18n/locales';
import { estimate } from './estimator';
import { ScopeInput, ShowProjectInput } from './schemas';

/** As ferramentas não têm efeito colateral: o lead só sai por /api/lead, com ação explícita do visitante. */
export function createTools(locale: Locale) {
  return {
    update_scope: tool({
      description:
        'Registra o escopo estruturado do projeto do cliente e devolve a faixa de prazo calculada deterministicamente. Use assim que tiver tipo, funcionalidades e integrações.',
      inputSchema: ScopeInput,
      execute: async (scope) => ({ scope, estimate: estimate(scope) }),
    }),
    show_project: tool({
      description: 'Destaca um projeto do portfolio para o visitante (use quando falar de um projeto específico).',
      inputSchema: ShowProjectInput,
      execute: async ({ slug }) => {
        const p = getProject(slug);
        return p ? { slug, title: p.title, path: localePath(locale, `/trabalho/${slug}`) } : { slug, missing: true };
      },
    }),
    request_contact: tool({
      description: 'Abre o formulário de contato na conversa. O envio depende do visitante preencher e consentir.',
      inputSchema: z.object({}),
      execute: async () => ({ open: true }),
    }),
  };
}
