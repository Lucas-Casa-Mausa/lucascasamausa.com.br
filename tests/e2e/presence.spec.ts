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
