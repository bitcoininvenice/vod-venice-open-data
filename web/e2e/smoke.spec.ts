import { expect, test } from '@playwright/test';

// Le fonti esterne sono reali: i test verificano struttura e comportamento, non i valori.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('vod_onboarding_completed', 'true'));
});

test('la home si carica senza errori JavaScript', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: /laguna/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('il tutorial compare alla prima visita e si chiude con Escape', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vod_onboarding_completed'));
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  // chiuderlo lo segna come visto: alla prossima visita non ricompare
  expect(await page.evaluate(() => localStorage.getItem('vod_onboarding_completed'))).toBe('true');
});

test('le azioni dell\'header restano dentro lo schermo', async ({ page }) => {
  await page.goto('/');
  const viewport = page.viewportSize()!;
  const buttons = page.locator('header button:visible');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    const label = (await buttons.nth(i).getAttribute('aria-label')) ?? (await buttons.nth(i).innerText());
    // la riga dei preset scorre in orizzontale per scelta
    if (!box || /laguna|venezia|mestre|lido|aeroporto/i.test(label)) continue;
    expect(box.x + box.width, `"${label}" esce dallo schermo`).toBeLessThanOrEqual(viewport.width + 1);
  }
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
});

test('su mobile il menu "Altro" offre metriche, lingua e palette', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo mobile');
  await page.goto('/');
  await page.getByRole('button', { name: /altre azioni/i }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: /metriche/i })).toBeVisible();
  await expect(menu.getByRole('menuitemradio', { name: /carta/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('il pannello livelli si apre e mostra i gruppi', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: /filtri/i }).click();
  // il pannello esiste in due varianti (desktop e cassetto mobile): conta quella visibile
  await expect(page.getByText(/mobilità & trasporti/i).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/laguna, idrografia/i).filter({ visible: true }).first()).toBeVisible();
});

test('la modale statistiche si apre e si chiude', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: /altre azioni/i }).click();
    await page.getByRole('menuitem', { name: /metriche/i }).click();
  } else {
    await page.getByRole('button', { name: /metriche/i }).click();
  }
  const dialog = page.getByRole('dialog', { name: /statistiche/i });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('il catalogo dei layer dichiara la natura dei dati', async ({ page }) => {
  await page.goto('/layers');
  await expect(page.getByText(/opere pubbliche 2026/i).first()).toBeVisible();
});

test.describe('API', () => {
  test('health elenca le fonti con uno stato', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(['ok', 'stale', 'degraded']).toContain(body.status);
    expect(body.sources.length).toBeGreaterThan(5);
    for (const s of body.sources) expect(['ok', 'stale', 'down']).toContain(s.status);
  });

  test('tide risponde con il contratto atteso anche se la fonte è giù', async ({ request }) => {
    const res = await request.get('/api/tide');
    const body = await res.json();
    expect([200, 503]).toContain(res.status());
    expect(body.data.moseGates).toHaveLength(4);
    expect(body.meta.levels.kind).toBe('live');
  });

  test('radius non valido restituisce 400', async ({ request }) => {
    const res = await request.get('/api/spatial/stops-near-cantieri?radius=999999');
    expect(res.status()).toBe(400);
  });

  test('header di sicurezza presenti', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });
});
