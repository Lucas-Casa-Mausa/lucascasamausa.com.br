import type { LabItem } from './types';

export const labItems: LabItem[] = [
  {
    name: 'gobalance',
    description: {
      pt: 'Load balancer L7 em Go com núcleo na biblioteca padrão: round-robin, least-connections, health check ativo, circuit breaker e rate limit.',
      en: 'L7 load balancer in Go with a standard-library core: round-robin, least-connections, active health checks, circuit breaker and rate limiting.',
    },
    stack: ['Go', 'Prometheus', 'Docker'],
    href: 'https://github.com/Lucas-Casa-Mausa/gobalance',
  },
  {
    name: 'vulnlab',
    description: {
      pt: 'Laboratório de segurança web: nove vulnerabilidades do OWASP Top 10 exploradas na prática, de SQL injection a SSRF.',
      en: 'Web security lab: nine OWASP Top 10 vulnerabilities exploited hands-on, from SQL injection to SSRF.',
    },
    stack: ['Python', 'Flask', 'Docker'],
  },
  {
    name: 'copilot-agents',
    description: {
      pt: 'Oito agentes customizados para o GitHub Copilot: revisão de código, segurança, arquitetura, performance e documentação.',
      en: 'Eight custom GitHub Copilot agents for code review, security, architecture, performance and documentation.',
    },
    stack: ['GitHub Copilot', 'Prompt engineering'],
    href: 'https://github.com/Lucas-Casa-Mausa/copilot-agents',
  },
];
