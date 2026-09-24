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

const clipOf = (page: import('@playwright/test').Page) =>
  page.locator('#trabalho').evaluate((el) => getComputedStyle(el).clipPath);

test.describe('reveal', () => {
  test('a prancheta entra recortada e termina inteira', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.evaluate(() => {
      const top = document.querySelector('#trabalho')!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.85);
    });
    await expect.poll(() => clipOf(page)).toMatch(/inset\((?!0%\)|0% 0% 0% 0%\))/);
    await page.evaluate(() => {
      const top = document.querySelector('#trabalho')!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top);
    });
    await expect.poll(() => clipOf(page)).toMatch(/^(none|inset\(0%( 0%){0,3}\)|inset\(0px( 0px){0,3}\))$/);
  });

  test('static não recorta', async ({ page }) => {
    await page.goto('/?motion=static');
    await page.waitForTimeout(1500);
    expect(await clipOf(page)).toBe('none');
  });

  test('a foto recebe a varredura âmbar ao entrar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    const sweep = page.locator('#sobre [data-photo-sweep]');
    await expect(sweep).toHaveAttribute('aria-hidden', 'true');
    await page.locator('#sobre figure').scrollIntoViewIfNeeded();
    await expect(sweep).toHaveAttribute('data-swept', 'true', { timeout: 5000 });
  });
});

const planeTransform = (page: import('@playwright/test').Page, plate: string, plane: number) =>
  page.locator(`#${plate} [data-plane="${plane}"]`).evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === 'none' ? 'identity' : new DOMMatrix(t).isIdentity ? 'identity' : t;
  });

test.describe('explode', () => {
  test('diagrama tem três planos e só o primeiro é a imagem acessível', async ({ page }) => {
    await page.goto('/');
    const stack = page.locator('#creditpulse-ai [data-explode]');
    await expect(stack.locator('svg[data-plane]')).toHaveCount(3);
    await expect(stack.locator('svg[role="img"]')).toHaveCount(1);
    await expect(stack.locator('svg[data-plane="0"]')).toHaveAttribute('role', 'img');
  });

  test('prancha entrando está separada e, no centro, montada', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    const scrollPlate = (fraction: number) =>
      page.evaluate((f) => {
        const el = document.querySelector('#threads [data-explode]')!;
        const r = el.getBoundingClientRect();
        window.scrollTo(0, r.top + window.scrollY - window.innerHeight * f);
      }, fraction);
    await scrollPlate(0.92);
    await expect.poll(() => planeTransform(page, 'threads', 2)).not.toBe('identity');
    await scrollPlate(0.2);
    await expect.poll(() => planeTransform(page, 'threads', 2)).toBe('identity');
  });

  test('static deixa tudo montado', async ({ page }) => {
    await page.goto('/?motion=static');
    await page.waitForTimeout(1500);
    await page.locator('#threads').scrollIntoViewIfNeeded();
    expect(await planeTransform(page, 'threads', 2)).toBe('identity');
  });
});

test.describe('movimento reduzido de ponta a ponta', () => {
  test.use({ reducedMotion: 'reduce' });
  test('nada anima: sem canvas, sem Lenis, sem recorte, pranchas montadas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await expect(page.locator('html')).toHaveAttribute('data-tier', 'static');
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    expect(await page.locator('#trabalho').evaluate((el) => getComputedStyle(el).clipPath)).toBe('none');
    await expect(page.locator('#sobre [data-photo-sweep]')).toHaveCSS('opacity', '0');
  });
});

test.describe('revisão final: scroll e ciclo de vida', () => {
  test('link direto com hash cai na seção mesmo com o movimento ligando', async ({ page }) => {
    await page.goto('/#contato');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.waitForTimeout(800);
    await expect(page.locator('#contato')).toBeInViewport();
  });

  test('menu mobile a partir de um caso leva à seção da home', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'só mobile');
    await page.goto('/trabalho/threads');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.getByRole('link', { name: 'Menu', exact: true }).click();
    await page.locator('#menu').getByRole('link', { name: 'Contato', exact: true }).click();
    await expect(page).toHaveURL(/\/#contato$/);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.waitForTimeout(800);
    await expect(page.locator('#contato')).toBeInViewport();
  });

  test('voltar de um caso restaura a posição na home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.locator('#threads').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(500);
    await page.getByRole('link', { name: 'Ver caso: THREADS' }).click();
    await expect(page).toHaveURL(/\/trabalho\/threads$/);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.goBack();
    await expect(page.locator('[data-hero-canvas]')).toHaveCount(1);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(80);
  });

  test('navegar antes do movimento carregar não deixa Lenis órfão', async ({ page }) => {
    let loaded = false;
    await page.route('**/_next/static/chunks/*.js', async (route) => {
      if (loaded) await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });
    await page.goto('/');
    loaded = true;
    await page.getByRole('link', { name: 'Ver caso: THREADS' }).click();
    await expect(page).toHaveURL(/\/trabalho\/threads$/);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/, { timeout: 15000 });
    await page.waitForTimeout(4000);
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  });
});

test.describe('revisão final: nome nunca some', () => {
  test('nenhum frame com o nome em DOM escondido e o canvas vazio (boot e resize)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'resize só no desktop');
    await page.addInitScript(() => {
      const w = window as unknown as { __blank: number };
      w.__blank = 0;
      const check = () => {
        const name = document.querySelector<HTMLElement>('[data-hero-name]');
        const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
        if (name?.dataset.canvasName === 'on' && canvas && canvas.width > 1) {
          const span = name.querySelector('span')!.getBoundingClientRect();
          const box = canvas.getBoundingClientRect();
          const k = canvas.width / box.width;
          const x = Math.round((span.left - box.left + span.width * 0.1) * k);
          const y = Math.round((span.top - box.top + span.height * 0.3) * k);
          const size = Math.max(4, Math.round(span.height * 0.4 * k));
          const data = canvas.getContext('2d')!.getImageData(x, y, size, size).data;
          let alpha = 0;
          for (let i = 3; i < data.length; i += 4) alpha += data[i];
          if (alpha === 0) w.__blank++;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    await page.goto('/');
    await expect(page.locator('[data-hero-name]')).toHaveAttribute('data-canvas-name', 'on');
    for (const width of [1200, 1000, 1300, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(300);
    }
    expect(await page.evaluate(() => (window as unknown as { __blank: number }).__blank)).toBe(0);
  });
});
