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

test.describe('hero', () => {
  test('canvas decorativo assume o nome, e o h1 continua acessível', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-hero-canvas]');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-hero-name]')).toHaveAttribute('data-canvas-name', 'on');
    await expect(page.getByRole('heading', { level: 1, name: 'Lucas Casa Mausa' })).toBeAttached();
    // O texto em DOM some de verdade (sem traço duplicado por baixo do canvas).
    const casa = page.locator('[data-hero-name] .text-outline');
    await expect(casa).toHaveCSS('-webkit-text-stroke-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-hero-name]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  });

  test('static não monta canvas e deixa o nome em DOM visível', async ({ page }) => {
    await page.goto('/?motion=static');
    await expect(page.locator('html')).toHaveAttribute('data-tier', 'static');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(0);
    await expect(page.locator('[data-hero-name]')).not.toHaveAttribute('data-canvas-name', 'on');
  });

  test('se o canvas não mede igual ao DOM, o h1 continua visível', async ({ page }) => {
    // Força divergência: os spans ficam com letter-spacing diferente do h1, que é o que o canvas mede.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '[data-hero-name] > span { letter-spacing: 0.3em !important; }';
        document.head.appendChild(style);
      });
    });
    await page.goto('/');
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(1);
    await page.waitForTimeout(500);
    await expect(page.locator('[data-hero-name]')).not.toHaveAttribute('data-canvas-name', 'on');
  });

  test('redimensionar mantém o nome alinhado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'só desktop');
    await page.goto('/');
    await expect(page.locator('[data-hero-name]')).toHaveAttribute('data-canvas-name', 'on');
    await page.setViewportSize({ width: 900, height: 800 });
    await page.waitForTimeout(400);
    await expect(page.locator('[data-hero-name]')).toHaveAttribute('data-canvas-name', 'on');
    const box = await page.locator('[data-hero-canvas]').boundingBox();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('pausa fora da tela e volta ao topo', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-hero-canvas]');
    await expect(canvas).toHaveAttribute('data-running', 'true');
    await page.locator('#contato').scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute('data-running', 'false');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(canvas).toHaveAttribute('data-running', 'true');
  });

  test('ir para um caso e voltar não duplica o canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(1);
    await page.getByRole('link', { name: 'Ver caso: THREADS' }).click();
    await expect(page).toHaveURL(/\/trabalho\/threads$/);
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(0);
    await page.goBack();
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(1);
  });
});

test.describe('scroll', () => {
  test('full/lite liga o Lenis e o static não', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.goto('/?motion=static');
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  });

  test('link da barra leva à seção com o Lenis ativo', async ({ page, isMobile }) => {
    test.skip(isMobile, 'barra de seções só no desktop');
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Contato', exact: true }).click();
    await expect(page.locator('#contato')).toBeInViewport();
  });

  test('menu mobile leva à seção com o Lenis ativo', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'só mobile');
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.getByRole('link', { name: 'Menu', exact: true }).click();
    await page.locator('#menu').getByRole('link', { name: 'Sobre', exact: true }).click();
    await expect(page.locator('#sobre')).toBeInViewport();
  });

  test('abrir um caso a partir do fim da home começa no topo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.locator('#plataforma-financeira').scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: 'Ver caso: Plataforma financeira' }).click();
    await expect(page).toHaveURL(/plataforma-financeira$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test('<html> declara data-scroll-behavior para o Next 16', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-scroll-behavior', 'smooth');
  });
});
