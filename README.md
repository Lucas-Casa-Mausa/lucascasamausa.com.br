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
| `AGENT_MODEL` | `provedor:modelo` (padrão `anthropic:claude-haiku-4-5`). Trocar de provedor: instalar `@ai-sdk/<provedor>`, registrar em `src/server/agent/models.ts`. |
| `ANTHROPIC_API_KEY` | chave do provedor padrão (cada provedor lê a sua). |
| `AGENT_DAILY_TOKEN_CAP` | teto global de tokens/dia (padrão 1500000). |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | limites e teto compartilhados. Sem eles, o agente responde 503 e a UI mostra o formulário. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | anti-bot invisível na primeira mensagem. |
| `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` | envio do lead (sem domínio verificado, use o remetente de teste do Resend). |
| `CONTENT_DENYLIST` | termos proibidos: checagem de CI **e** filtro de saída do agente. |
| `AGENT_ALLOW_MOCK` | só testes: habilita `AGENT_MODEL=mock:scripted`, store em memória e dispensa o Turnstile. Nunca em produção. |
