'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n/locales';
import { ContactForm } from './ContactForm';
import type { AgentLabels } from './labels';
import { ScopeCard } from './ScopeCard';
import { buildSummary } from './summary';
import { disposeTurnstile, getTurnstileToken, TURNSTILE_CONTAINER_ID } from './turnstile-client';

const STORAGE_KEY = 'agent-history';

const load = (): UIMessage[] => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as UIMessage[];
  } catch {
    return [];
  }
};

type ToolPart = { type: string; state?: string; output?: unknown };

export function AgentOverlay({ locale, labels, initialText, onClose }: {
  locale: Locale; labels: AgentLabels; initialText: string | null; onClose: () => void;
}) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  const [draft, setDraft] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
        // Resolvido no envio: o token do Turnstile só existe (e só é exigido) na primeira mensagem.
        body: async () => ({ locale, turnstileToken: await getTurnstileToken() }),
      }),
    [locale],
  );
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: () => setUnavailable(true),
  });
  const busy = status === 'submitted' || status === 'streaming';

  // Histórico por aba: restaura na montagem, salva a cada mudança.
  useEffect(() => disposeTurnstile, []);

  useEffect(() => {
    const saved = load();
    if (saved.length) setMessages(saved);
    if (initialText && !sentInitial.current) {
      sentInitial.current = true; // StrictMode monta efeitos duas vezes em dev
      void sendMessage({ text: initialText });
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage indisponível: segue sem persistir */
    }
  }, [messages]);

  const close = useCallback(() => {
    if (busy) void stop();
    onClose();
  }, [busy, stop, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab' || !rootRef.current) return;
      // Foco dá a volta dentro do diálogo (padrão WAI-ARIA de modal).
      const focusables = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = rootRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  // Modal de verdade: o resto da página fica inerte (fora do Tab e do leitor de tela) e não rola por trás.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const siblings = Array.from(document.body.children).filter((el) => !el.contains(root)) as HTMLElement[];
    for (const el of siblings) el.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const openerEl = opener.current as HTMLElement | null;
    return () => {
      for (const el of siblings) el.inert = false;
      document.body.style.overflow = overflow;
      openerEl?.focus?.(); // só depois de tirar o inert: elemento inerte não recebe foco
    };
  }, []);

  const summary = useMemo(() => buildSummary(messages as never), [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    void sendMessage({ text });
  };

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-labelledby={titleId} data-agent-overlay data-lenis-prevent
      className="fixed inset-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-ink text-bone">
      <header className="flex items-center justify-between border-b border-line-dark px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase md:px-8">
        <h2 id={titleId} className="text-amber">● {labels.title}</h2>
        <button type="button" onClick={close} className="min-h-11 text-muted hover:text-bone">{labels.close}</button>
      </header>

      <ol aria-live="polite" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
        {messages.map((m) => (
          <li key={m.id}>
            {(m.parts as Array<ToolPart & { text?: string }>).map((p, i) => {
              if (p.type === 'text' && m.role === 'user')
                return <p key={i} className="font-serif text-2xl italic [overflow-wrap:anywhere] md:text-4xl">{p.text}</p>;
              if (p.type === 'text')
                return <p key={i} className="font-mono text-sm leading-relaxed [overflow-wrap:anywhere]"><span className="text-amber">agente › </span>{p.text}</p>;
              if (p.type === 'tool-update_scope' && p.state === 'output-available')
                return <ScopeCard key={i} output={p.output as never} labels={labels} />;
              if (p.type === 'tool-show_project' && p.state === 'output-available') {
                const out = p.output as { path?: string; title?: string };
                return out.path ? (
                  <Link key={i} href={out.path} onClick={onClose} className="inline-flex min-h-11 items-center font-mono text-sm text-amber underline">
                    {labels.viewProject}: {out.title}
                  </Link>
                ) : null;
              }
              if (p.type === 'tool-request_contact' && p.state === 'output-available')
                return <ContactForm key={i} locale={locale} labels={labels} summary={summary} />;
              return null;
            })}
          </li>
        ))}
        {busy && <li className="font-mono text-sm text-muted">{labels.thinking}</li>}
        {unavailable && (
          <li>
            <p className="font-mono text-sm text-muted">{labels.unavailable}</p>
            <ContactForm locale={locale} labels={labels} summary={summary} />
          </li>
        )}
      </ol>

      <form onSubmit={submit} className="sticky bottom-0 border-t border-line-dark bg-ink px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-b border-amber font-mono text-sm">
          <span aria-hidden="true" className="text-amber">›</span>
          <label className="sr-only" htmlFor="agent-overlay-input">{labels.placeholder}</label>
          <input id="agent-overlay-input" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            disabled={busy} maxLength={1500} autoComplete="off" placeholder={labels.placeholder}
            className="min-h-11 flex-1 bg-transparent placeholder:text-muted focus:outline-none disabled:opacity-50" />
          <button type="submit" disabled={busy} className="min-h-11 px-2 text-amber uppercase disabled:opacity-50">{labels.send}</button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl font-mono text-[11px] text-muted">{labels.privacy}</p>
        <div id={TURNSTILE_CONTAINER_ID} className="mx-auto mt-2 max-w-3xl" />
      </form>
    </div>
  );
}
