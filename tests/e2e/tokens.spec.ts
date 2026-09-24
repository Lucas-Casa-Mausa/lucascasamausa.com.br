import { expect, test } from '@playwright/test';

test('body usa o fundo tinta e o texto osso', async ({ page }) => {
  await page.goto('/');
  const styles = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { bg: s.backgroundColor, color: s.color };
  });
  expect(styles.bg).toBe('rgb(11, 11, 10)');
  expect(styles.color).toBe('rgb(239, 233, 220)');
});

test('as quatro variáveis de fonte estão no <html>', async ({ page }) => {
  await page.goto('/');
  const vars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return ['--font-archivo', '--font-archivo-narrow', '--font-plex-mono', '--font-newsreader'].map((v) =>
      s.getPropertyValue(v).trim(),
    );
  });
  for (const v of vars) expect(v).not.toBe('');
});
