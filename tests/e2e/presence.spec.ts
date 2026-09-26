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

test.describe('presença no chat', () => {
  const trackStates = async (page: import('@playwright/test').Page) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __presence: string[] };
      w.__presence = [];
      new MutationObserver((ms) => {
        for (const m of ms) {
          const el = m.target as HTMLElement;
          if (el.hasAttribute('data-presence-host')) w.__presence.push(el.dataset.state ?? '');
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
    });
  };
  const log = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as { __presence: string[] }).__presence.join(','));
  const openFromPrompt = async (page: import('@playwright/test').Page, text: string) => {
    const form = page.locator('form[data-agent-form]');
    await form.getByRole('textbox').fill(text);
    await form.getByRole('button', { name: /enviar/i }).click();
    return page.getByRole('dialog');
  };

  test('pensando → respondendo → repouso, guiado pelo stream', async ({ page }) => {
    await trackStates(page);
    await page.route('**/api/agent', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/?motion=full');
    const dialog = await openFromPrompt(page, 'oi');
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    // Resposta só de texto: depois do primeiro "speaking" não pode voltar a "thinking" (piscar no fim da fala).
    await expect.poll(() => log(page)).toMatch(/^(idle,)*thinking(,thinking)*(,speaking)+(,idle)+$/);
  });

  test('a linha de status acompanha o estado (desktop)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'status só no stage do desktop');
    await page.route('**/api/agent', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/?motion=full');
    const dialog = await openFromPrompt(page, 'oi');
    await expect(dialog.locator('[data-presence-status]')).toContainText(/pensando/i);
    await expect(dialog.locator('[data-presence-status]')).toContainText(/repouso/i);
  });

  test('reabrir com histórico restaurado não finge que está falando', async ({ page }) => {
    await trackStates(page);
    await page.goto('/?motion=full');
    const dialog = await openFromPrompt(page, 'oi');
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.evaluate(() => ((window as unknown as { __presence: string[] }).__presence = []));
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog').getByText(/agente do portfolio do Lucas/)).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await log(page)).not.toContain('speaking');
  });

  test('cruzar o breakpoint troca o host sem deixar dois loops', async ({ page, isMobile }) => {
    test.skip(isMobile, 'começa no desktop');
    await page.goto('/?motion=full');
    const dialog = await openFromPrompt(page, 'oi');
    const stage = dialog.locator('[data-presence-stage] [data-presence-host]');
    const header = dialog.locator('h2 [data-presence-host]');
    await expect(stage).toHaveAttribute('data-running', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(header).toHaveAttribute('data-running', 'true');
    await expect(stage.locator('canvas')).toHaveCount(0);
    await expect(dialog.locator('canvas[data-presence-canvas]')).toHaveCount(1);
  });

  test('static: o overlay mostra o SVG e o chat funciona', async ({ page }) => {
    await page.goto('/?motion=static');
    const dialog = await openFromPrompt(page, 'oi');
    await expect(dialog.getByText(/agente do portfolio do Lucas/)).toBeVisible();
    await expect(dialog.locator('canvas[data-presence-canvas]')).toHaveCount(0);
    await expect(dialog.locator('[data-presence-host] [data-presence-svg]').filter({ visible: true })).toHaveCount(1);
  });
});

test.describe('transição', () => {
  test('abrir pelo prompt esconde a miniatura de origem; fechar devolve', async ({ page }) => {
    await page.goto('/?motion=full');
    const mini = page.locator('[data-agent-presence="prompt"]');
    const form = page.locator('form[data-agent-form]');
    await form.getByRole('textbox').fill('oi');
    await form.getByRole('button', { name: /enviar/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(mini).toHaveCSS('visibility', 'hidden');
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();
    await expect(mini).toHaveCSS('visibility', 'visible');
  });

  test('Esc duplo no meio da abertura fecha uma vez e não deixa a miniatura escondida', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?motion=full');
    const form = page.locator('form[data-agent-form]');
    await form.getByRole('textbox').fill('oi');
    await form.getByRole('button', { name: /enviar/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-agent-presence="prompt"]')).toHaveCSS('visibility', 'visible');
    expect(errors).toEqual([]);
  });

  test('abrir pela nav usa a miniatura da nav como origem', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular o link fica dentro do menu');
    await page.goto('/?motion=full');
    await page.locator('header nav a[data-agent-open]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('header nav [data-agent-presence="nav"]')).toHaveCSS('visibility', 'hidden');
  });

  test('sem origem (Ctrl+K) abre e fecha normalmente', async ({ page }) => {
    await page.goto('/?motion=full');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test.describe('com movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });
    test('sem transform na abertura', async ({ page }) => {
      await page.goto('/');
      const form = page.locator('form[data-agent-form]');
      await form.getByRole('textbox').fill('oi');
      await form.getByRole('button', { name: /enviar/i }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const transforms = await dialog.evaluate((root) =>
        root.getAnimations({ subtree: true }).flatMap((a) => ((a.effect as KeyframeEffect).getKeyframes() as { transform?: string }[]).map((k) => k.transform ?? '')),
      );
      expect(transforms.filter(Boolean)).toEqual([]);
    });
  });
});
