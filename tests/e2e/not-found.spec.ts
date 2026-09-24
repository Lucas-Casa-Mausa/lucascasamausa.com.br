import { expect, test } from '@playwright/test';

test('404 desenhado em pt', async ({ page }) => {
  const response = await page.goto('/rota-inexistente');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Rota não encontrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Voltar para o início/ })).toHaveAttribute('href', '/');
});

test('404 desenhado em en', async ({ page }) => {
  const response = await page.goto('/en/nothing-here');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Route not found' })).toBeVisible();
});

// fixme: no Next 16, com o layout raiz em app/[locale], notFound() chega ao HTML do servidor como
// <html id="__next_error__"> (vazio, sem lang) e o 404 desenhado só aparece após a hidratação.
// Status 404 está correto. Ver ledger "Final: Ruling" do Plano 1.
test.describe.fixme('404 sem JavaScript', () => {
  for (const [path, lang, title] of [
    ['/rota-inexistente', 'pt-BR', 'Rota não encontrada'],
    ['/trabalho/nao-existe', 'pt-BR', 'Rota não encontrada'],
    ['/es', 'pt-BR', 'Rota não encontrada'],
    ['/en/nada-aqui', 'en', 'Route not found'],
  ] as const) {
    test(`${path} chega com o h1 no HTML e lang ${lang}`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toContain(`<html lang="${lang}"`);
      expect(html).toMatch(new RegExp(`<h1[^>]*>${title}</h1>`));
    });
  }
});
