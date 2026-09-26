import type { PresenceName } from './state';

type Part = { type: string; state?: string; text?: string };
type Msg = { role: string; parts: readonly Part[] };

export type ChatPrev = { len: number; status: string };
export type ChatPresence = { state: PresenceName; tool: boolean; textLen: number; delta: number };

/** Depois do último pulso, "falando" segura esse tempo antes de voltar ao repouso. */
export const SPEAK_HOLD_MS = 600;

const DONE = new Set(['output-available', 'output-error']);
const isBusy = (status: string) => status === 'submitted' || status === 'streaming';

export const pulseAmp = (delta: number) => Math.min(0.95, 0.55 + delta / 200);

/**
 * Traduz o estado do useChat em estado da presença.
 * Texto novo só conta como fala se o chat está (ou acabou de estar) ocupado: histórico restaurado não pulsa.
 */
export function presenceFromChat(status: string, messages: readonly Msg[], prev: ChatPrev | null): ChatPresence {
  let textLen = 0;
  for (const m of messages) if (m.role === 'assistant') for (const p of m.parts) if (p.type === 'text') textLen += p.text?.length ?? 0;
  const counts = prev !== null && (isBusy(status) || isBusy(prev.status));
  const delta = counts ? Math.max(0, textLen - prev.len) : 0;
  const last = messages[messages.length - 1];
  const tool = isBusy(status) && last?.role === 'assistant' && last.parts.some((p) => p.type.startsWith('tool-') && !DONE.has(p.state ?? ''));
  const state: PresenceName = delta > 0 ? 'speaking' : isBusy(status) ? 'thinking' : 'idle';
  return { state, tool, textLen, delta };
}
