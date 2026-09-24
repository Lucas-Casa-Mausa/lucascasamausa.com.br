import { expect, test } from '@playwright/test';

const cases = [
  ['creditpulse-ai', 'CreditPulse AI'],
  ['fast-semantic-cache', 'fast-semantic-cache'],
  ['threads', 'THREADS'],
  ['kiwibit', 'Kiwibit'],
  ['plataforma-financeira', 'Plataforma financeira'],
] as const;

for (const [slug, title] of cases) {
  for (const prefix of ['', '/en']) {
    test(`${prefix}/trabalho/${slug} renderiza e cabe em 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      const response = await page.goto(`${prefix}/trabalho/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }
}

test('confidencial mostra a nota e nenhum link externo', async ({ page }) => {
  await page.goto('/trabalho/plataforma-financeira');
  await expect(page.getByText('Projeto profissional sob confidencialidade')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Links' })).toHaveCount(0);
});

test('repositório privado não mostra link de código', async ({ page }) => {
  await page.goto('/trabalho/creditpulse-ai');
  await expect(page.getByRole('link', { name: /Código/ })).toHaveCount(0);
});

test('kiwibit mostra código e site no ar em nova aba', async ({ page }) => {
  await page.goto('/trabalho/kiwibit');
  const live = page.getByRole('link', { name: /Site no ar/ });
  await expect(live).toHaveAttribute('href', 'https://kiwibitweb.vercel.app');
  await expect(live).toHaveAttribute('target', '_blank');
  await expect(live).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('link', { name: /Código/ })).toHaveAttribute('href', 'https://github.com/K1w1b1t/kiwibit_web');
});

test('seletor de idioma mantém a página do caso', async ({ page }) => {
  await page.goto('/trabalho/threads');
  await page.getByRole('link', { name: 'Mudar idioma para inglês' }).click();
  await expect(page).toHaveURL(/\/en\/trabalho\/threads$/);
});

test('voltar leva para a seção de trabalho', async ({ page }) => {
  await page.goto('/trabalho/threads');
  await page.getByRole('link', { name: /Voltar aos projetos/ }).click();
  await expect(page).toHaveURL(/\/#trabalho$/);
});

for (const path of ['/trabalho/CreditPulse-AI', '/trabalho/nao-existe', '/en/trabalho/nao-existe']) {
  test(`${path} responde 404`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}

test('slug inexistente não vira arquivo de cache no disco', async ({ request }) => {
  const { existsSync } = await import('node:fs');
  const slug = `inexistente-${Date.now()}`;
  const response = await request.get(`/trabalho/${slug}`);
  expect(response.status()).toBe(404);
  expect(existsSync(`.next/server/app/pt/trabalho/${slug}.html`)).toBe(false);
  const file = `${slug}.txt`;
  expect((await request.get(`/${file}`)).status()).toBe(404);
  expect(existsSync(`.next/server/app/${file}.html`)).toBe(false);
});
