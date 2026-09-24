import { expect, test } from '@playwright/test';

test.describe('nível de movimento', () => {
  test('desktop é full e celular é lite', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-tier', isMobile ? 'lite' : 'full');
  });

  test('?motion=static força static', async ({ page }) => {
    await page.goto('/?motion=static');
    await expect(page.locator('html')).toHaveAttribute('data-tier', 'static');
  });

  test.describe('com movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });
    test('é static', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-tier', 'static');
    });
  });
});
