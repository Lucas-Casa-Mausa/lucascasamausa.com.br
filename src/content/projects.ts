import type { Project } from './types';

export const DIAGRAM_VIEWBOX = { w: 400, h: 240 } as const;

const N = { w: 120, h: 36 } as const; // tamanho padrão de nó

export const projects: Project[] = [
  {
    slug: 'creditpulse-ai',
    plate: '01',
    title: 'CreditPulse AI',
    tagline: {
      pt: 'Agente de voz que faz a pré-análise de crédito imobiliário numa única conversa.',
      en: 'A voice agent that pre-qualifies mortgage applicants in a single conversation.',
    },
    problem: {
      pt: 'A triagem inicial de financiamento costuma ser um formulário longo ou uma ligação para coletar sempre os mesmos dados: renda, entrada, valor do imóvel e dívidas. É lento para quem pede e caro para quem atende.',
      en: "Initial mortgage screening is usually a long form or a phone call to collect the same data every time: income, down payment, property value and debts. It's slow for the applicant and expensive for the lender.",
    },
    solution: {
      pt: 'Um agente de voz conduz a conversa, entende correções no meio da fala ("na verdade, com a renda do meu cônjuge…") e preenche um dossiê estruturado. Um painel ao vivo mostra comprometimento de renda, LTV e amortização SAC enquanto a pessoa fala.',
      en: 'A voice agent runs the conversation, understands mid-sentence corrections ("actually, with my spouse\'s income…") and fills a structured dossier. A live dashboard shows debt-to-income, loan-to-value and amortization while the person talks.',
    },
    decisions: {
      pt: [
        'O LLM não calcula nada: os números vêm de um motor determinístico em Python, e o modelo só recebe o resultado por tool call.',
        'Pipeline de áudio em tempo real: PCM 16-bit a 24 kHz pelo WebSocket, com barge-in para o usuário poder interromper o agente.',
        'Status indicativo guiado por uma política configurável, em vez de um "aprovado/reprovado" seco.',
      ],
      en: [
        'The LLM computes nothing: numbers come from a deterministic Python engine, and the model only receives results through tool calls.',
        'Real-time audio pipeline: 16-bit PCM at 24 kHz over WebSocket, with barge-in so the user can interrupt the agent.',
        'Indicative statuses driven by a configurable policy instead of a blunt approved/rejected.',
      ],
    },
    stack: ['Python', 'FastAPI', 'WebSocket', 'AssemblyAI', 'React 19', 'TypeScript', 'Tailwind 4', 'Web Audio API'],
    links: [],
    diagram: {
      nodes: [
        { id: 'voice', label: { pt: 'Voz do cliente', en: 'Caller voice' }, x: 8, y: 102, ...N, layer: 0 },
        { id: 'api', label: { pt: 'FastAPI + WebSocket', en: 'FastAPI + WebSocket' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'voiceai', label: { pt: 'AssemblyAI', en: 'AssemblyAI' }, x: 272, y: 30, ...N, layer: 2 },
        { id: 'engine', label: { pt: 'Motor determinístico', en: 'Deterministic engine' }, x: 272, y: 102, ...N, layer: 2 },
        { id: 'score', label: { pt: 'Scorecard ao vivo', en: 'Live scorecard' }, x: 272, y: 174, ...N, layer: 1 },
      ],
      edges: [
        { from: 'voice', to: 'api' },
        { from: 'api', to: 'voiceai' },
        { from: 'api', to: 'engine' },
        { from: 'api', to: 'score' },
      ],
    },
  },
  {
    slug: 'fast-semantic-cache',
    plate: '02',
    title: 'fast-semantic-cache',
    tagline: {
      pt: 'Cache para chamadas de IA: pergunta repetida volta em milissegundos, sem pagar a API de novo.',
      en: 'A cache for AI calls: repeated questions come back in milliseconds, without paying the API again.',
    },
    problem: {
      pt: 'Aplicações com LLM pagam e esperam várias vezes pela mesma resposta: perguntas repetidas ou quase iguais viram chamadas novas à API.',
      en: 'LLM applications pay for, and wait on, the same answer over and over: repeated or near-identical questions become brand-new API calls.',
    },
    solution: {
      pt: 'Um gateway na frente do provedor de LLM responde do cache quando é seguro: um tier exato pelo hash do payload completo e um tier lexical opcional (MinHash/LSH com verificador determinístico), com isolamento por cliente.',
      en: 'A gateway in front of the LLM provider answers from cache when it is safe to: an exact tier keyed on the full payload hash and an optional lexical tier (MinHash/LSH with a deterministic verifier), isolated per client.',
    },
    decisions: {
      pt: [
        'Exato por padrão: o tier aproximado nasce desligado e roda em shadow mode até provar que não erra.',
        'Invalidei meus próprios benchmarks ao encontrar vazamento entre os conjuntos de calibração e teste, e reposicionei o produto com base nisso.',
        'Requisições com tools, imagens ou que dependem da hora atual nunca saem do cache.',
      ],
      en: [
        'Exact by default: the approximate tier ships disabled and runs in shadow mode until it proves it does not get answers wrong.',
        'I invalidated my own benchmarks after finding leakage between the calibration and test sets, and repositioned the product based on that.',
        'Requests with tools, images or that depend on the current time never come from cache.',
      ],
    },
    stack: ['Python', 'FastAPI', 'Redis', 'Pydantic v2', 'MinHash/LSH', 'k6', 'pytest'],
    links: [],
    diagram: {
      nodes: [
        { id: 'app', label: { pt: 'Sua aplicação', en: 'Your app' }, x: 8, y: 102, ...N, layer: 0 },
        { id: 'gateway', label: { pt: 'Gateway', en: 'Gateway' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'redis', label: { pt: 'Redis', en: 'Redis' }, x: 140, y: 186, ...N, layer: 0 },
        { id: 'exact', label: { pt: 'Tier 0: exato', en: 'Tier 0: exact' }, x: 272, y: 30, ...N, layer: 2 },
        { id: 'lexical', label: { pt: 'Tier 1: lexical', en: 'Tier 1: lexical' }, x: 272, y: 102, ...N, layer: 2 },
        { id: 'llm', label: { pt: 'Provedor de LLM', en: 'LLM provider' }, x: 272, y: 174, ...N, layer: 1 },
      ],
      edges: [
        { from: 'app', to: 'gateway' },
        { from: 'gateway', to: 'redis' },
        { from: 'gateway', to: 'exact' },
        { from: 'gateway', to: 'lexical' },
        { from: 'gateway', to: 'llm' },
      ],
    },
  },
  {
    slug: 'threads',
    plate: '03',
    title: 'THREADS',
    tagline: {
      pt: 'Concorrência e paralelismo explicados com animação, não com slide.',
      en: 'Concurrency and parallelism explained with animation, not slides.',
    },
    problem: {
      pt: 'Threads, concorrência e paralelismo costumam ser ensinados com diagramas estáticos, e a diferença entre eles raramente fica clara.',
      en: 'Threads, concurrency and parallelism are usually taught with static diagrams, and the difference between them rarely sinks in.',
    },
    solution: {
      pt: 'Uma plataforma interativa com animações, uma linha do tempo que compara execução sequencial, concorrente e paralela lado a lado, e quizzes com progresso salvo por usuário.',
      en: 'An interactive platform with animations, a timeline comparing sequential, concurrent and parallel execution side by side, and quizzes with per-user progress.',
    },
    decisions: {
      pt: [
        'Backend assíncrono de ponta a ponta, com SQLAlchemy 2 async e asyncpg.',
        'Autenticação JWT com rate limit e hardening de segurança nas rotas de quiz e progresso.',
        'CI com testes e PostgreSQL 17 em Docker Compose.',
      ],
      en: [
        'Async backend end to end, with SQLAlchemy 2 async and asyncpg.',
        'JWT authentication with rate limiting and security hardening on the quiz and progress routes.',
        'CI with tests and PostgreSQL 17 on Docker Compose.',
      ],
    },
    stack: ['React 19', 'Vite', 'Framer Motion', 'Zustand', 'FastAPI', 'SQLAlchemy 2', 'PostgreSQL 17', 'Docker'],
    links: [{ kind: 'repo', href: 'https://github.com/Lucas-Casa-Mausa/THREADS' }],
    diagram: {
      nodes: [
        { id: 'ui', label: { pt: 'React + Motion', en: 'React + Motion' }, x: 8, y: 102, ...N, layer: 0 },
        { id: 'api', label: { pt: 'FastAPI async', en: 'Async FastAPI' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'db', label: { pt: 'PostgreSQL 17', en: 'PostgreSQL 17' }, x: 272, y: 56, ...N, layer: 2 },
        { id: 'auth', label: { pt: 'JWT + rate limit', en: 'JWT + rate limit' }, x: 272, y: 148, ...N, layer: 2 },
      ],
      edges: [
        { from: 'ui', to: 'api' },
        { from: 'api', to: 'db' },
        { from: 'api', to: 'auth' },
      ],
    },
  },
  {
    slug: 'kiwibit',
    plate: '04',
    title: 'Kiwibit',
    tagline: {
      pt: 'Site, blog e área de membros de um coletivo de tecnologia, construídos em equipe.',
      en: 'Website, blog and members area for a tech collective, built as a team.',
    },
    problem: {
      pt: 'O coletivo precisava de presença própria: um site institucional com blog, perfis de membros e uma área administrativa para gerir tudo sem depender de ferramentas externas.',
      en: 'The collective needed a home of its own: a website with a blog, member profiles and an admin area to run it all without relying on external tools.',
    },
    solution: {
      pt: 'Junto com o time, construí o painel administrativo: gestão e criação de membros, dashboard com métricas, login e proteção das páginas de admin, além de correções de acessibilidade e testes nas rotas.',
      en: 'Together with the team, I built the admin panel: member management and creation, a metrics dashboard, login and protection of admin pages, plus accessibility fixes and route tests.',
    },
    decisions: {
      pt: [
        'Feature-Sliced Design para manter o código organizado entre três pessoas.',
        'Guard de sessão no servidor em todas as páginas de admin.',
        'Testes nas rotas administrativas e quality gate no SonarCloud.',
      ],
      en: [
        'Feature-Sliced Design to keep the codebase organized across three people.',
        'Server-side session guard on every admin page.',
        'Tests on the admin routes and a SonarCloud quality gate.',
      ],
    },
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind 4', 'Prisma 7', 'PostgreSQL', 'NextAuth', 'Jest'],
    links: [
      { kind: 'repo', href: 'https://github.com/K1w1b1t/kiwibit_web' },
      { kind: 'live', href: 'https://kiwibitweb.vercel.app' },
    ],
    badge: 'collaboration',
    diagram: {
      nodes: [
        { id: 'site', label: { pt: 'Site + blog', en: 'Site + blog' }, x: 8, y: 40, ...N, layer: 0 },
        { id: 'admin', label: { pt: 'Painel admin', en: 'Admin panel' }, x: 8, y: 164, ...N, layer: 0 },
        { id: 'next', label: { pt: 'Next.js 16', en: 'Next.js 16' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'auth', label: { pt: 'NextAuth', en: 'NextAuth' }, x: 272, y: 40, ...N, layer: 2 },
        { id: 'db', label: { pt: 'Prisma + Postgres', en: 'Prisma + Postgres' }, x: 272, y: 164, ...N, layer: 2 },
      ],
      edges: [
        { from: 'site', to: 'next' },
        { from: 'admin', to: 'next' },
        { from: 'next', to: 'auth' },
        { from: 'next', to: 'db' },
      ],
    },
  },
  {
    slug: 'plataforma-financeira',
    plate: '05',
    title: 'Plataforma financeira',
    tagline: {
      pt: 'Plataforma financeira multi-organização, em produção.',
      en: 'A multi-organization financial platform, in production.',
    },
    problem: {
      pt: 'Uma plataforma financeira precisava hospedar várias organizações, cada uma com seus usuários, credenciais e integrações, sem que um dado vazasse de uma para outra.',
      en: 'A financial platform had to host several organizations, each with its own users, credentials and integrations, without any data leaking from one to another.',
    },
    solution: {
      pt: 'Reestruturei o backend para multi-organização com isolamento verificado: escopo de acesso checado pelo compilador, toda consulta SQL passando por uma porta que exige o filtro da organização, e credenciais de integração cifradas por organização.',
      en: 'I restructured the backend for multiple organizations with verified isolation: access scope checked by the compiler, every SQL query going through a gate that requires the organization filter, and integration credentials encrypted per organization.',
    },
    decisions: {
      pt: [
        'Fail-closed: todo endpoint nasce bloqueado para uma nova organização até ser revisado.',
        'Checagens de CI que impedem consulta sem escopo e leitura de credencial fora do lugar certo.',
        'Concorrência tratada como requisito: locks, idempotência e compare-and-set nos fluxos que não podem duplicar.',
      ],
      en: [
        'Fail-closed: every endpoint starts blocked for a new organization until it has been reviewed.',
        'CI checks that prevent unscoped queries and credential reads from the wrong place.',
        'Concurrency treated as a requirement: locks, idempotency and compare-and-set on flows that must never run twice.',
      ],
    },
    stack: ['TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ'],
    links: [],
    badge: 'confidential',
    diagram: {
      nodes: [
        { id: 'orgs', label: { pt: 'Organizações', en: 'Organizations' }, x: 8, y: 102, ...N, layer: 0 },
        { id: 'scope', label: { pt: 'Escopo por org.', en: 'Per-org scope' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'sql', label: { pt: 'SQL com porta', en: 'Gated SQL' }, x: 272, y: 30, ...N, layer: 2 },
        { id: 'secrets', label: { pt: 'Segredos cifrados', en: 'Encrypted secrets' }, x: 272, y: 102, ...N, layer: 2 },
        { id: 'queues', label: { pt: 'Filas idempotentes', en: 'Idempotent queues' }, x: 272, y: 174, ...N, layer: 2 },
      ],
      edges: [
        { from: 'orgs', to: 'scope' },
        { from: 'scope', to: 'sql' },
        { from: 'scope', to: 'secrets' },
        { from: 'scope', to: 'queues' },
      ],
    },
  },
  {
    slug: 'agente',
    plate: '00',
    title: 'Este agente',
    tagline: {
      pt: 'O agente deste portfolio: entende o seu projeto e devolve um escopo inicial com prazo.',
      en: "This portfolio's agent: it understands your project and returns an initial scope with a timeline.",
    },
    problem: {
      pt: 'Quem chega com uma ideia de projeto quer saber rápido se faz sentido e quanto tempo leva, antes de marcar uma conversa.',
      en: 'People who arrive with a project idea want to know quickly whether it makes sense and how long it takes, before booking a call.',
    },
    solution: {
      pt: 'Um agente conversacional faz poucas perguntas, monta o escopo estruturado e mostra uma faixa de prazo calculada por uma tabela determinística. Se fizer sentido, o contato chega ao Lucas por e-mail, com o resumo pronto.',
      en: 'A conversational agent asks a few questions, builds a structured scope and shows a timeline range computed by a deterministic table. If it makes sense, the contact reaches Lucas by email with the summary ready.',
    },
    decisions: {
      pt: [
        'Agnóstico de provedor: o modelo é uma variável de ambiente; trocar de LLM não mexe no resto.',
        'O LLM não calcula prazo nem dá preço: o prazo vem de uma tabela, e um filtro remove qualquer valor em dinheiro do stream.',
        'Nenhuma ferramenta tem efeito colateral: o lead só é enviado quando a pessoa preenche e consente.',
      ],
      en: [
        'Provider-agnostic: the model is an environment variable; switching LLMs touches nothing else.',
        'The LLM neither computes timelines nor quotes prices: the timeline comes from a table, and a filter strips any money value from the stream.',
        'No tool has side effects: the lead is only sent when the person fills in the form and consents.',
      ],
    },
    stack: ['Next.js', 'Vercel AI SDK', 'TypeScript', 'Zod', 'Upstash Redis', 'Resend'],
    links: [],
    action: 'try-agent',
    diagram: {
      nodes: [
        { id: 'visitor', label: { pt: 'Visitante', en: 'Visitor' }, x: 8, y: 102, ...N, layer: 0 },
        { id: 'api', label: { pt: 'API do agente', en: 'Agent API' }, x: 140, y: 102, ...N, layer: 1 },
        { id: 'llm', label: { pt: 'LLM (qualquer)', en: 'LLM (any)' }, x: 272, y: 30, ...N, layer: 2 },
        { id: 'estimator', label: { pt: 'Estimador', en: 'Estimator' }, x: 272, y: 102, ...N, layer: 2 },
        { id: 'lead', label: { pt: 'Lead por e-mail', en: 'Lead by email' }, x: 272, y: 174, ...N, layer: 1 },
      ],
      edges: [
        { from: 'visitor', to: 'api' },
        { from: 'api', to: 'llm' },
        { from: 'api', to: 'estimator' },
        { from: 'api', to: 'lead' },
      ],
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
