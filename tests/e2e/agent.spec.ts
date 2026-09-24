import { expect, test } from '@playwright/test';

// Cada teste com um IP próprio: o rate limit (10/min por IP) é coberto nos testes unitários,
// e aqui desktop + mobile somados passariam do limite.
test.beforeEach(async ({ page }) => {
  const n = () => Math.floor(Math.random() * 250) + 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `10.${n()}.${n()}.${n()}` });
});

const open = async (page: import('@playwright/test').Page, text: string) => {
  await page.goto('/');
  const form = page.locator('form[data-agent-form]');
  await form.getByRole('textbox').fill(text);
  await form.getByRole('button', { name: /enviar/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
};

test('prompt do hero abre a conversa em tela cheia e o agente responde', async ({ page }) => {
  const dialog = await open(page, 'oi');
  await expect(dialog.getByText('oi', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
});

test('cliente com projeto recebe o cartão de escopo com a faixa do estimador', async ({ page }) => {
  const dialog = await open(page, 'tenho uma clínica e quero agendamento');
  const card = dialog.locator('[data-scope-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('8');
  await expect(card).toContainText('15');
  await expect(card).toContainText(/estimativa inicial/i);
});

test('valor monetário nunca aparece', async ({ page }) => {
  const dialog = await open(page, 'qual o preço?');
  await expect(dialog).toContainText('[sob consulta]');
  await expect(dialog).not.toContainText(/R\$\s?\d/);
});

test('pedido de contato mostra o formulário com consentimento e envia', async ({ page }) => {
  const dialog = await open(page, 'quero contato');
  const form = dialog.locator('form[data-contact-form]');
  await form.getByLabel(/nome/i).fill('Ana Souza');
  await form.getByLabel(/e-mail/i).fill('ana@example.com');
  await form.getByRole('button', { name: /enviar/i }).click();
  await expect(form.getByRole('checkbox')).toBeFocused(); // sem consentimento não envia
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: /enviar/i }).click();
  await expect(dialog.getByText(/recebido|obrigado/i)).toBeVisible();
});

test('erro do provedor vira formulário de contato', async ({ page }) => {
  const dialog = await open(page, 'erro');
  await expect(dialog.locator('form[data-contact-form]')).toBeVisible();
});

test('input desabilitado enquanto a resposta chega', async ({ page }) => {
  await page.route('**/api/agent', async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  const dialog = await open(page, 'oi');
  await expect(dialog.getByRole('textbox')).toBeDisabled();
  await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
  await expect(dialog.getByRole('textbox')).toBeEnabled();
});

test('fechar e reabrir mantém o histórico; Esc fecha', async ({ page }) => {
  const dialog = await open(page, 'oi');
  await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Control+k'); // no mobile o link "Agente" fica dentro do menu fechado
  await expect(page.getByRole('dialog').getByText(/agente do portfolio do Lucas/)).toBeVisible();
});

test('Ctrl+K abre o agente', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('overlay sem scroll horizontal em 360px e barra fixa não cobre o contato', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só mobile');
  const dialog = await open(page, 'tenho uma clínica e quero agendamento');
  await expect(dialog.locator('[data-scope-card]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await page.keyboard.press('Escape');
  await page.locator('#contato').scrollIntoViewIfNeeded();
  const bar = await page.locator('form[data-agent-form]').boundingBox();
  const last = await page.locator('#contato a').last().boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(bar!.y + 1);
});

test('sem JS o prompt leva ao contato', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/`);
  await page.locator('form[data-agent-form]').getByRole('textbox').fill('oi');
  await page.locator('form[data-agent-form]').getByRole('button', { name: /enviar/i }).click();
  await expect(page).toHaveURL(/#contato/);
  await context.close();
});

test('o agente não entra no JS inicial', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'script') scripts.push(await r.text().catch(() => ''));
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(scripts.some((s) => s.includes('data-scope-card'))).toBe(false);
});

test('botão Testar da prancha 00 abre o agente', async ({ page }) => {
  await page.goto('/');
  await page.locator('#agente').getByRole('button', { name: /testar/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test.describe('revisão final da UI do agente', () => {
  test('I6: atalho "Sou recrutador" envia o texto do botão', async ({ page, isMobile }) => {
    test.skip(isMobile, 'atalhos só aparecem no desktop');
    await page.goto('/');
    await page.locator('form[data-agent-form]').getByRole('button', { name: 'Sou recrutador' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Sou recrutador', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Ver projeto/ })).toBeVisible();
  });

  test('I7: clique duplo em Enviar não perde a mensagem', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('form[data-agent-form]');
    await form.getByRole('textbox').fill('oi');
    await form.getByRole('button', { name: /enviar/i }).dblclick();
    await expect(page.getByRole('dialog').getByText(/agente do portfolio do Lucas/)).toBeVisible();
  });

  test('I8: a roda do mouse rola a conversa, não a página por trás', async ({ page, isMobile }) => {
    test.skip(isMobile, 'roda do mouse só no desktop');
    const dialog = await open(page, 'oi');
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    const input = dialog.locator('#agent-overlay-input');
    for (const t of ['tenho uma clínica e quero agendamento', 'quero contato']) {
      await input.fill(t);
      await input.press('Enter');
      await expect(input).toBeEnabled();
    }
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    const before = await page.evaluate(() => window.scrollY);
    await dialog.hover();
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(600);
    expect(await dialog.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('I9: Tab fica dentro do diálogo e Fechar devolve o foco', async ({ page }) => {
    const dialog = await open(page, 'oi');
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.closest('form[data-agent-form]') !== null)).toBe(true);
  });

  test('I10: URL longa não cria scroll horizontal no diálogo (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const dialog = await open(page, 'https://exemplo.com/' + 'a'.repeat(300)); // token sem ponto de quebra
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    const overflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('I11: o lead leva o resumo da conversa (mesmo sem escopo)', async ({ page }) => {
    let sent: { summary?: string } = {};
    await page.route('**/api/lead', async (route) => {
      sent = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    const dialog = await open(page, 'sou dono de uma padaria e quero contato');
    const form = dialog.locator('form[data-contact-form]');
    await expect(form.getByText(/padaria/)).toBeVisible(); // resumo mostrado antes do consentimento
    await form.getByLabel(/nome/i).fill('Ana Souza');
    await form.getByLabel(/e-mail/i).fill('ana@example.com');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: /enviar/i }).click();
    await expect(dialog.getByText(/recebido/i)).toBeVisible();
    expect(sent.summary).toContain('padaria');
  });
});
