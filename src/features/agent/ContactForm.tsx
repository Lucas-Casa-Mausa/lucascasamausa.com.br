'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/locales';
import { PERSON } from '@/lib/site';
import type { AgentLabels } from './labels';

export function ContactForm({ locale, labels, summary }: { locale: Locale; labels: AgentLabels; summary: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        locale,
        name: data.get('name'),
        email: data.get('email'),
        company: data.get('company') ?? '',
        consent: data.get('consent') === 'on',
        summary,
      }),
    }).catch(() => null);
    setState(res?.ok ? 'ok' : 'error');
  };

  if (state === 'ok') return <p className="font-mono text-sm text-amber">{labels.contactOk}</p>;
  return (
    <form data-contact-form onSubmit={onSubmit} className="my-4 flex max-w-md flex-col gap-3 border border-line-dark p-4 font-mono text-sm">
      <p className="text-amber uppercase tracking-[0.08em]">{labels.contactTitle}</p>
      <label className="flex flex-col gap-1">{labels.name}<input name="name" required minLength={2} maxLength={120} className="min-h-11 border-b border-line-dark bg-transparent" /></label>
      <label className="flex flex-col gap-1">{labels.email}<input name="email" type="email" required maxLength={200} className="min-h-11 border-b border-line-dark bg-transparent" /></label>
      <label className="flex flex-col gap-1">{labels.company}<input name="company" maxLength={160} className="min-h-11 border-b border-line-dark bg-transparent" /></label>
      <label className="flex items-start gap-2 text-[12px] text-muted"><input name="consent" type="checkbox" required className="mt-1" />{labels.consent}</label>
      <button type="submit" disabled={state === 'sending'} className="min-h-11 self-start text-amber uppercase">{labels.contactSend}</button>
      {state === 'error' && (
        <p className="text-muted">{labels.contactError} <a className="text-amber underline" href={`mailto:${PERSON.email}`}>{PERSON.email}</a></p>
      )}
    </form>
  );
}
