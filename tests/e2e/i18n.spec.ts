import { expect, test } from '@playwright/test';

test('/ está em português com lang pt-BR', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByText('Construo produtos web e agentes de IA')).toBeVisible();
});

test('/en está em inglês com lang en', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('I build web products and AI agents')).toBeVisible();
});

test('/pt redireciona para /', async ({ page }) => {
  await page.goto('/pt');
  expect(new URL(page.url()).pathname).toBe('/');
});

test('/es não é um idioma: responde 404', async ({ page }) => {
  const response = await page.goto('/es');
  expect(response?.status()).toBe(404);
});

test('Accept-Language em inglês não redireciona a home', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  expect(new URL(page.url()).pathname).toBe('/');
  await context.close();
});
