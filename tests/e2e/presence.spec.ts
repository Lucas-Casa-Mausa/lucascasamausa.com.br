import { expect, test } from '@playwright/test';

// IP próprio por teste (o rate limit do agente é por IP), como em agent.spec.ts.
test.beforeEach(async ({ page }) => {
  const n = () => Math.floor(Math.random() * 250) + 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `10.${n()}.${n()}.${n()}` });
});

test.describe('miniaturas', () => {
  test('36 px na nav e 56/40 px no prompt, sem mudar a altura da nav', async ({ page, isMobile }) => {
    await page.goto('/?motion=static');
    const prompt = (await page.locator('form[data-agent-form] [data-agent-presence="prompt"]').boundingBox())!;
    expect(Math.round(prompt.width)).toBe(isMobile ? 40 : 56);
    expect(Math.round(prompt.height)).toBe(isMobile ? 40 : 56);
    if (!isMobile) {
      const nav = (await page.locator('header nav [data-agent-presence="nav"]').boundingBox())!;
      expect(Math.round(nav.width)).toBe(36);
      expect(Math.round(nav.height)).toBe(36);
    }
    const header = (await page.locator('header').first().boundingBox())!;
    expect(header.height).toBeLessThanOrEqual(61.5); // medido antes da mudança: 61 px (desktop e mobile)
  });

  test('o SVG estático vem no HTML (funciona sem JS)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}/`);
    await expect(page.locator('[data-agent-presence="prompt"] [data-presence-svg] path').first()).toBeAttached();
    await context.close();
  });
});

test.describe('canvas das miniaturas', () => {
  test('no full o canvas monta por cima do SVG', async ({ page }) => {
    await page.goto('/?motion=full');
    const prompt = page.locator('[data-agent-presence="prompt"]');
    await expect(prompt).toHaveAttribute('data-running', 'true');
    await expect(prompt.locator('canvas[data-presence-canvas]')).toHaveCount(1);
    await expect(prompt.locator('[data-presence-svg]')).toHaveCSS('visibility', 'hidden');
  });

  test('static: só o SVG', async ({ page }) => {
    await page.goto('/?motion=static');
    await page.waitForTimeout(1500);
    await expect(page.locator('canvas[data-presence-canvas]')).toHaveCount(0);
    await expect(page.locator('[data-agent-presence="prompt"] [data-presence-svg]')).toBeVisible();
  });

  test.describe('com movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });
    test('só o SVG', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);
      await expect(page.locator('canvas[data-presence-canvas]')).toHaveCount(0);
    });
  });

  test('fora da tela o loop pausa; a da nav (header sticky) continua', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular o prompt é uma barra fixa, sempre visível');
    await page.goto('/?motion=full');
    const prompt = page.locator('[data-agent-presence="prompt"]');
    await expect(prompt).toHaveAttribute('data-running', 'true');
    await page.locator('#contato').scrollIntoViewIfNeeded();
    await expect(prompt).toHaveAttribute('data-running', 'false');
    await expect(page.locator('header nav [data-agent-presence="nav"]')).toHaveAttribute('data-running', 'true');
  });

  test('sem canvas 2D: fica o SVG e o chat funciona', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/?motion=full');
    await page.waitForTimeout(1500);
    await expect(page.locator('canvas[data-presence-canvas]')).toHaveCount(0);
    await expect(page.locator('[data-agent-presence="prompt"] [data-presence-svg]')).toBeVisible();
    const form = page.locator('form[data-agent-form]');
    await form.getByRole('textbox').fill('oi');
    await form.getByRole('button', { name: /enviar/i }).click();
    await expect(page.getByRole('dialog').getByText(/agente do portfolio do Lucas/)).toBeVisible();
  });

  test('hover no prompt acorda a miniatura', async ({ page, isMobile }) => {
    test.skip(isMobile, 'sem hover no celular');
    await page.goto('/?motion=full');
    const prompt = page.locator('[data-agent-presence="prompt"]');
    await expect(prompt).toHaveAttribute('data-running', 'true');
    await page.locator('form[data-agent-form]').hover();
    await expect(prompt).toHaveAttribute('data-state', 'listening');
  });
});
