import { getTranslations } from 'next-intl/server';
import { localePath, type Locale } from '@/i18n/locales';

export async function HeroPrompt({ locale }: { locale: Locale }) {
  const t = await getTranslations('agent');
  const chips = ['project', 'ai', 'recruiter'] as const;
  return (
    <form
      data-agent-form
      action={`${localePath(locale, '/')}#contato`}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-dark bg-ink px-4 py-3 md:static md:border-0 md:bg-transparent md:p-0"
    >
      <div className="flex items-center gap-2 border-b border-amber font-mono text-sm md:max-w-[640px]">
        <span aria-hidden="true" className="text-amber">›</span>
        <label className="sr-only" htmlFor="agent-q">{t('placeholder')}</label>
        <input id="agent-q" name="q" maxLength={1500} autoComplete="off" placeholder={t('placeholder')}
          className="min-h-11 flex-1 bg-transparent text-bone placeholder:text-muted focus:outline-none" />
        <button type="submit" className="min-h-11 px-2 text-amber uppercase tracking-[0.06em]">{t('send')}</button>
      </div>
      <div className="mt-2 hidden gap-2 md:flex">
        {chips.map((c) => (
          <button key={c} type="submit" name="q" value={t(`chips.${c}`)}
            className="min-h-9 rounded-full border border-line-dark px-3 font-mono text-[11px] text-muted hover:text-bone">
            {t(`chips.${c}`)}
          </button>
        ))}
      </div>
    </form>
  );
}
