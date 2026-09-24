import { expect, test } from '@playwright/test';

test('o nome é o h1 da home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Lucas Casa Mausa' })).toBeVisible();
});

test('"O que eu faço" tem as três frentes', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Produtos', 'IA aplicada', 'Base']) {
    await expect(page.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
  }
});

for (const path of ['/', '/en']) {
  test(`sem scroll horizontal em 360px (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test('no desktop o nome ocupa a largura e tudo cabe na primeira dobra', async ({ page, isMobile }) => {
  test.skip(isMobile, 'só desktop');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // Largura do texto (não da caixa do bloco): maior linha renderizada do h1.
  const textWidth = await page.getByRole('heading', { level: 1 }).evaluate((h1) => {
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    const lines = new Map<number, { left: number; right: number }>();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width === 0) continue;
        const key = Math.round(r.top);
        const line = lines.get(key) ?? { left: r.left, right: r.right };
        lines.set(key, { left: Math.min(line.left, r.left), right: Math.max(line.right, r.right) });
      }
    }
    return Math.max(...Array.from(lines.values(), (l) => l.right - l.left));
  });
  expect(textWidth).toBeGreaterThanOrEqual(1440 * 0.65);
  expect(textWidth).toBeLessThanOrEqual(1440 - 64);
  await expect(page.getByText('Construo produtos web e agentes de IA')).toBeInViewport({ ratio: 1 });
});
