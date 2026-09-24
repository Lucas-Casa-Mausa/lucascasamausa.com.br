'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { Locale } from '@/i18n/locales';
import type { AgentLabels } from './labels';

type OverlayProps = { locale: Locale; labels: AgentLabels; initialText: string | null; onClose: () => void };

/** Único JS do agente no carregamento. O overlay (e o @ai-sdk/react) só baixa na primeira abertura. */
export function AgentLauncher({ locale, labels }: { locale: Locale; labels: AgentLabels }) {
  const [Overlay, setOverlay] = useState<ComponentType<OverlayProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [initialText, setInitialText] = useState<string | null>(null);

  const opening = useRef(false);

  const show = useCallback(async (text: string | null) => {
    // Um segundo submit (vazio) durante a abertura não pode apagar o texto do primeiro.
    if (opening.current && !text) return;
    opening.current = true;
    if (text || !open) setInitialText(text);
    if (!Overlay) {
      const mod = await import('./AgentOverlay');
      setOverlay(() => mod.AgentOverlay);
    }
    setOpen(true);
    opening.current = false;
  }, [Overlay, open]);

  useEffect(() => {
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form.matches('[data-agent-form]')) return;
      e.preventDefault();
      // Atalhos são botões com value próprio; o campo de texto vem antes no FormData, então lê o submitter.
      const fromButton = e.submitter instanceof HTMLButtonElement ? e.submitter.value : '';
      const text = (fromButton || String(new FormData(form).get('q') ?? '')).trim();
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
