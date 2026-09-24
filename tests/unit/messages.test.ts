import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';

function flatten(obj: unknown, prefix = ''): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return { [prefix]: obj };
  return Object.entries(obj).reduce<Record<string, unknown>>(
    (acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }),
    {},
  );
}

describe('mensagens', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(Object.keys(flatten(en)).sort()).toEqual(Object.keys(flatten(pt)).sort());
  });

  it('nenhuma mensagem é vazia', () => {
    for (const messages of [pt, en]) {
      for (const [key, value] of Object.entries(flatten(messages))) {
        expect(typeof value === 'string' && value.trim().length > 0, key).toBe(true);
      }
    }
  });
});
