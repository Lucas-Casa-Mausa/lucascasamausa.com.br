import { describe, expect, it } from 'vitest';
import { onScreenFrom } from '@/features/agent/presence/mount';

describe('onScreenFrom (IntersectionObserver)', () => {
  it('usa a entrada mais recente quando o observer entrega várias do mesmo alvo', () => {
    // Rolagem rápida: saiu e voltou antes do callback rodar. Vale a última.
    expect(onScreenFrom([{ isIntersecting: false }, { isIntersecting: true }])).toBe(true);
    expect(onScreenFrom([{ isIntersecting: true }, { isIntersecting: false }])).toBe(false);
  });

  it('sem entradas, considera fora da tela', () => {
    expect(onScreenFrom([])).toBe(false);
  });
});
