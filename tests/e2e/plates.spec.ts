import { expect, test } from '@playwright/test';

test('cinco pranchas na ordem certa', async ({ page }) => {
  await page.goto('/');
  const plates = page.locator('#trabalho article');
  await expect(plates).toHaveCount(5);
  const ids = await plates.evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['creditpulse-ai', 'fast-semantic-cache', 'threads', 'kiwibit', 'plataforma-financeira']);
});

test('selos de colaboração e confidencial', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#kiwibit [data-badge="collaboration"]')).toHaveText(/Colaboração/i);
  await expect(page.locator('#plataforma-financeira [data-badge="confidential"]')).toHaveText(/Confidencial/i);
  await expect(page.locator('#threads [data-badge]')).toHaveCount(0);
});

test('cada diagrama tem nós com camada para a explosão 3D', async ({ page }) => {
  await page.goto('/');
  for (const id of ['creditpulse-ai', 'fast-semantic-cache', 'threads', 'kiwibit', 'plataforma-financeira']) {
    const layers = await page.locator(`#${id} svg g[data-layer]`).evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-layer')),
    );
    expect(layers.length).toBeGreaterThan(0);
    for (const l of layers) expect(['0', '1', '2']).toContain(l);
  }
});

test('"Ver caso" tem nome acessível único e leva à página do caso', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Ver caso: THREADS' });
  await expect(link).toHaveAttribute('href', '/trabalho/threads');
});

test('em inglês os rótulos do diagrama traduzem', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('#creditpulse-ai [data-explode]')).toContainText('Deterministic engine');
});
