import type { ActiveTier } from './tier';

/** Liga os efeitos da página atual. Cada efeito devolve sua limpeza; a ordem de limpeza é a inversa. */
export async function startMotion(tier: ActiveTier): Promise<() => void> {
  const cleanups: (() => void)[] = [];
  void tier;
  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
