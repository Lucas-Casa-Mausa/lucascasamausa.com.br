import { z } from 'zod';
import { projects } from '@/content/projects';

export const MAX_MESSAGE_CHARS = 1500;
export const MAX_USER_TURNS = 20;

export const ScopeInput = z.object({
  kind: z.enum(['landing', 'site_admin', 'web_system', 'ai_agent', 'mobile_native']),
  features: z.array(z.string().max(80)).max(10),
  addons: z.array(z.enum(['whatsapp', 'payments', 'i18n'])).max(3),
  thirdPartyIntegrations: z.number().int().min(0).max(5),
  openQuestions: z.array(z.string().max(160)).max(5),
});

export const ShowProjectInput = z.object({
  slug: z.enum(projects.map((p) => p.slug) as [string, ...string[]]),
});

const TextPart = z.object({ type: z.literal('text'), text: z.string() });

/** Corpo do /api/agent. Mensagens no formato UIMessage do AI SDK; só validamos o que as guardas usam. */
export const AgentRequestBody = z.object({
  locale: z.enum(['pt', 'en']),
  turnstileToken: z.string().max(2048).optional(),
  messages: z
    .array(
      z
        .object({ id: z.string(), role: z.enum(['user', 'assistant', 'system']), parts: z.array(z.unknown()) })
        .passthrough(),
    )
    .min(1),
});

export function userTexts(messages: z.infer<typeof AgentRequestBody>['messages']): string[] {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) =>
      m.parts
        .map((p) => TextPart.safeParse(p))
        .filter((r) => r.success)
        .map((r) => r.data.text)
        .join(''),
    );
}

export const LeadBody = z.object({
  locale: z.enum(['pt', 'en']),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  company: z.string().trim().max(160).optional().default(''),
  consent: z.literal(true),
  summary: z.string().max(4000).optional().default(''),
});
