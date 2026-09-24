import { expect, test } from '@playwright/test';

test('primeiro Tab foca "Pular para o conteúdo"', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
});

test('links têm foco visível ao navegar por teclado', async ({ page }) => {
  await page.goto('/');
  // Tab 1 = pular para o conteúdo, Tab 2 = marca "Casa Mausa". Via teclado para ativar :focus-visible.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const brand = page.getByRole('link', { name: 'Casa Mausa' });
  await expect(brand).toBeFocused();
  const outline = await brand.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

test('seletor de idioma leva para /en e volta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Mudar idioma para inglês' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.getByRole('link', { name: 'Switch language to Portuguese' }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
});

test('desktop mostra as seções na barra', async ({ page, isMobile }) => {
  test.skip(isMobile, 'só desktop');
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  for (const name of ['Trabalho', 'Lab', 'Sobre', 'Contato']) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }
});

test('mobile abre o menu sem JS e navega até a seção', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só mobile');
  await page.goto('/');
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.locator('#menu').getByRole('link', { name: 'Contato', exact: true }).click();
  await expect(page).toHaveURL(/#contato$/);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`menu mobile (JS ${javaScriptEnabled ? 'ligado' : 'desligado'})`, () => {
    test.use({ javaScriptEnabled });
    test('fecha depois de escolher uma seção', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'só mobile');
      await page.goto('/');
      await page.getByRole('link', { name: 'Menu', exact: true }).click();
      const menu = page.locator('#menu');
      await expect(menu).toBeVisible();
      await menu.getByRole('link', { name: 'Trabalho', exact: true }).click();
      await expect(page).toHaveURL(/#trabalho$/);
      await expect(menu).toBeHidden();
    });
  });
}
