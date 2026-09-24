'use client';

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import type { Locale } from '@/i18n/locales';
import type { AgentLabels } from './labels';

type OverlayProps = { locale: Locale; labels: AgentLabels; initialText: string | null; onClose: () => void };

/** Único JS do agente no carregamento. O overlay (e o @ai-sdk/react) só baixa na primeira abertura. */
export function AgentLauncher({ locale, labels }: { locale: Locale; labels: AgentLabels }) {
  const [Overlay, setOverlay] = useState<ComponentType<OverlayProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [initialText, setInitialText] = useState<string | null>(null);

  const show = useCallback(async (text: string | null) => {
    setInitialText(text);
    if (!Overlay) {
      const mod = await import('./AgentOverlay');
      setOverlay(() => mod.AgentOverlay);
    }
    setOpen(true);
  }, [Overlay]);

  useEffect(() => {
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form.matches('[data-agent-form]')) return;
      e.preventDefault();
      const data = new FormData(form, e.submitter);
      const text = String(data.get('q') ?? '').trim();
      const input = form.querySelector<HTMLInputElement>('input[name="q"]');
      if (input) input.value = '';
      void show(text || null);
    };
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as Element).closest('[data-agent-open]');
      if (!trigger) return;
      e.preventDefault();
      void show(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        void show(null);
      }
    };
    document.addEventListener('submit', onSubmit);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('submit', onSubmit);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [show]);

  if (!Overlay || !open) return null;
  return <Overlay locale={locale} labels={labels} initialText={initialText} onClose={() => setOpen(false)} />;
}
