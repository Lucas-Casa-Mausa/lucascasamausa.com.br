import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = ['/', '/en', '/trabalho/creditpulse-ai', '/en/trabalho/plataforma-financeira', '/rota-inexistente'];

for (const path of paths) {
  test(`sem violações sérias de acessibilidade em ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious,
      JSON.stringify(serious.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), null, 2),
    ).toEqual([]);
  });
}
