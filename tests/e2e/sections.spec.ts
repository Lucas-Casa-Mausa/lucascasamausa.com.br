import { expect, test } from '@playwright/test';

test('laboratório lista os três itens, com link só onde há repositório público', async ({ page }) => {
  await page.goto('/');
  const lab = page.locator('#lab');
  for (const name of ['gobalance', 'vulnlab', 'copilot-agents']) await expect(lab).toContainText(name);
  await expect(lab.getByRole('link', { name: /gobalance/ })).toHaveAttribute('href', 'https://github.com/Lucas-Casa-Mausa/gobalance');
  await expect(lab.getByRole('link', { name: /vulnlab/ })).toHaveCount(0);
});

test('sobre tem retrato (ou monograma) com texto alternativo e os três princípios', async ({ page }) => {
  await page.goto('/');
  const about = page.locator('#sobre');
  await expect(about.getByRole('img', { name: 'Retrato de Lucas Casa Mausa em preto e branco' })).toBeVisible();
  for (const name of ['Spec antes de código', 'Medir antes de decidir', 'IA com rigor']) {
    await expect(about.getByRole('heading', { name })).toBeVisible();
  }
});

test('contato tem e-mail, LinkedIn e GitHub, e nada de WhatsApp', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contato');
  await expect(contact.getByRole('link', { name: /lucascasamausa000@gmail.com/ })).toHaveAttribute(
    'href',
    'mailto:lucascasamausa000@gmail.com',
  );
  await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/lucas-casa-mausa',
  );
  await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/Lucas-Casa-Mausa');
  await expect(page.locator('a[href*="wa.me"], a[href*="whatsapp"]')).toHaveCount(0);
});

test('seções em inglês', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('#sobre')).toContainText('How I work');
  await expect(page.locator('#contato')).toContainText("Let's build something");
});
