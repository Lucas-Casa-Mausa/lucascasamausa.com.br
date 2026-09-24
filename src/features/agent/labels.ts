import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/locales';

export async function getAgentLabels(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'agent' });
  return {
    placeholder: t('placeholder'), send: t('send'), title: t('title'), close: t('close'), privacy: t('privacy'),
    scopeTitle: t('scopeTitle'), scopeWeeks: t.raw('scopeWeeks') as string, scopeNote: t('scopeNote'),
    scopeOut: t('scopeOut'), viewProject: t('viewProject'), contactTitle: t('contactTitle'), name: t('name'),
    email: t('email'), company: t('company'), consent: t('consent'), contactSend: t('contactSend'),
    contactOk: t('contactOk'), contactError: t('contactError'), unavailable: t('unavailable'), thinking: t('thinking'),
  };
}
export type AgentLabels = Awaited<ReturnType<typeof getAgentLabels>>;
