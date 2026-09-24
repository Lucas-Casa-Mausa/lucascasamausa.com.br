/** Turnstile (Cloudflare) no cliente: só age com NEXT_PUBLIC_TURNSTILE_SITE_KEY; o token vai na 1ª mensagem. */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render(el: HTMLElement, opts: {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: () => void;
    appearance?: 'always' | 'execute' | 'interaction-only';
  }): string;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
const loadScript = () =>
  (scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(s);
  }));

export const TURNSTILE_CONTAINER_ID = 'agent-turnstile';

let widgetId: string | null = null;
let used = false;

/** Token para a primeira mensagem da sessão; depois disso (ou sem site key) devolve undefined. */
export async function getTurnstileToken(): Promise<string | undefined> {
  const container = document.getElementById(TURNSTILE_CONTAINER_ID);
  if (!SITE_KEY || used || !container) return undefined;
  used = true;
  await loadScript();
  return new Promise<string | undefined>((resolve) => {
    widgetId =
      window.turnstile?.render(container, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        callback: (token) => resolve(token),
        'error-callback': () => resolve(undefined),
      }) ?? null;
    if (!widgetId) resolve(undefined);
  });
}

export function disposeTurnstile() {
  if (widgetId) window.turnstile?.remove(widgetId);
  widgetId = null;
}
