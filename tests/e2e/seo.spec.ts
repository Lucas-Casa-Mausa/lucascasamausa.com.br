import { expect, test } from '@playwright/test';

test('metadata da home em pt', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Lucas Casa Mausa — produtos web e agentes de IA');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Engenheiro de software em São Paulo/);
  // O Next serializa a raiz sem barra final; é o mesmo recurso que "/".
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lucascasamausa.com.br');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://lucascasamausa.com.br/en');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://lucascasamausa.com.br');
});

test('canonical do caso em en', async ({ page }) => {
  await page.goto('/en/trabalho/threads');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lucascasamausa.com.br/en/trabalho/threads');
  await expect(page).toHaveTitle('THREADS — Lucas Casa Mausa');
});

test('página de caso tem og:image que responde PNG', async ({ page, request }) => {
  await page.goto('/trabalho/threads');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toBeTruthy();
  const url = new URL(og!);
  const response = await request.get(url.pathname + url.search);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
});

test('JSON-LD Person na home', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? '{}');
  expect(data['@type']).toBe('Person');
  expect(data.name).toBe('Lucas Casa Mausa');
  expect(data.sameAs).toContain('https://github.com/Lucas-Casa-Mausa');
});

test('imagem OG responde como PNG', async ({ page, request }) => {
  await page.goto('/en');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toBeTruthy();
  const url = new URL(og!);
  const response = await request.get(url.pathname + url.search);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
});

test('sitemap tem as rotas nos dois idiomas', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text();
  expect(body).toContain('<loc>https://lucascasamausa.com.br/</loc>');
  expect(body).toContain('<loc>https://lucascasamausa.com.br/en/trabalho/threads</loc>');
  expect(body).toContain('<loc>https://lucascasamausa.com.br/trabalho/plataforma-financeira</loc>');
});

test('robots aponta o sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Sitemap: https://lucascasamausa.com.br/sitemap.xml');
});
