# lucascasamausa.com.br

Portfolio de Lucas Casa Mausa — produtos web e agentes de IA.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · next-intl

## Rodando

    npm install
    npm run dev          # http://localhost:3000
    npm run test         # unitários (Vitest)
    npm run build && npm run e2e   # ponta a ponta (Playwright)

## Envs (agente)

| Env | Para quê |
|---|---|
| `AGENT_MODEL` | `openrouter:<modelo>` (padrão `openrouter:google/gemma-4-31b-it:free`). Qualquer modelo do OpenRouter serve, inclusive pagos (ex.: Claude). Outro provedor: instalar `@ai-sdk/<provedor>` e registrar em `src/server/agent/models.ts`. |
| `AGENT_FALLBACK_MODELS` | reservas do OpenRouter, separadas por vírgula, tentadas em ordem se o principal falhar ou estiver no limite. Ausente: padrão do código; vazio: nenhuma. |
| `OPENROUTER_API_KEY` | chave do OpenRouter. Modelos `:free` não cobram, mas têm limite diário; acima dele o chat mostra o formulário de contato. |
| `AGENT_DAILY_TOKEN_CAP` | teto global de tokens/dia (padrão 1500000). |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | limites e teto compartilhados. Sem eles, o agente responde 503 e a UI mostra o formulário. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | anti-bot invisível; depois do 1º token o servidor emite um cookie de sessão assinado (2 h). |
| `AGENT_SESSION_SECRET` | segredo do cookie de sessão (padrão: o próprio `TURNSTILE_SECRET_KEY`). |
| `CLIENT_IP_HEADER` | cabeçalho de IP confiável do host (ex.: `cf-connecting-ip` na Cloudflare, `x-real-ip` na Vercel). Padrão `x-forwarded-for`, forjável se o host não o sobrescrever. |
| `LEAD_DAILY_CAP` | teto global de leads por dia (padrão 30). |
| `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` | envio do lead (sem domínio verificado, use o remetente de teste do Resend). |
| `CONTENT_DENYLIST` | termos proibidos: checagem de CI **e** filtro de saída do agente. |
| `AGENT_ALLOW_MOCK` | só testes: habilita `AGENT_MODEL=mock:scripted`, store em memória e dispensa o Turnstile. Nunca em produção. |

## Deploy (Cloudflare Workers)

Build com o adaptador OpenNext (`open-next.config.ts`, `wrangler.jsonc`). O site é 100% SSG; as páginas saem dos static assets.

- `npm run cf:preview` — build + Worker local no runtime da Cloudflare (`workerd`).
- `npm run cf:deploy` — build + deploy (precisa de `npx wrangler login` antes).
- Segredos: `npx wrangler secret put <NOME>` para `OPENROUTER_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`, `AGENT_SESSION_SECRET`, `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` e `CONTENT_DENYLIST` (o agente também usa a lista em tempo de execução).
- Variáveis não secretas ficam em `vars` no `wrangler.jsonc` (já inclui `CLIENT_IP_HEADER=cf-connecting-ip`).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` entra no **build** (vai para o JS do cliente): exporte no shell antes do `cf:deploy`.
- Limite do plano grátis: Worker até ~3 MB comprimido (hoje ~2,9 MB; `npx wrangler deploy --dry-run` mostra o tamanho). A imagem de OG é estática por isso (`npm run og`).
- Não ligar `enableCacheInterception` no `open-next.config.ts`: com o prefetch por segmento do Next 16 ele gera um loop de requisições.
