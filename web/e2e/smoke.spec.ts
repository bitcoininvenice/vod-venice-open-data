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
  await expect(page.getByText('Ambiente', { exact: true }).filter({ visible: true }).first()).toBeVisible();
});

test('il menu porta alla pagina delle metriche', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: /altre azioni/i }).click();
  } else {
    await page.getByRole('button', { name: /menu strumenti/i }).click();
  }
  await page.getByRole('menuitem', { name: /metriche/i }).first().click();
  await expect(page).toHaveURL(/\/metrics$/);
  await expect(page.getByRole('heading', { level: 1, name: /metriche/i })).toBeVisible();
});

test('il menu porta all\'elenco dei livelli', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: /altre azioni/i }).click();
  } else {
    await page.getByRole('button', { name: /menu strumenti/i }).click();
  }
  await page.getByRole('menuitem', { name: /elenco livelli/i }).first().click();
  await expect(page).toHaveURL(/\/layers$/);
});

test('il menu strumenti si usa da tastiera', async ({ page, isMobile }) => {
  test.skip(isMobile, 'solo desktop');
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /menu strumenti/i });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const items = page.getByRole('menu').getByRole('menuitem');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('il pannello export si apre, si chiude e si riapre senza errori', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const open = async () => {
    if (isMobile) await page.getByRole('button', { name: /altre azioni/i }).click();
    else await page.getByRole('button', { name: /menu strumenti/i }).click();
    await page.getByRole('menuitem', { name: /esportazione dati/i }).click();
  };
  for (let i = 0; i < 2; i++) {
    await open();
    const dialog = page.getByRole('dialog', { name: /esportazione dati/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /chiudi/i }).click();
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('i layer attivi finiscono nell\'URL e il preset viene rimosso', async ({ page }) => {
  await page.goto('/?preset=satellites');
  await expect(page).toHaveURL(/layers=/);
  expect(new URL(page.url()).searchParams.get('preset')).toBeNull();
  // ricaricando si ritrovano gli stessi layer, non il preset
  const layers = new URL(page.url()).searchParams.get('layers');
  await page.reload();
  expect(new URL(page.url()).searchParams.get('layers')).toBe(layers);
});

test('la pagina delle fonti mostra lo stato', async ({ page }) => {
  await page.goto('/sources');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/\d+\/\d+ fonti operative/i)).toBeVisible();
});

test('metriche, fonti e 404 sono tradotte in inglese', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('vod_language', 'en'));
  await page.goto('/metrics');
  await expect(page.getByRole('heading', { level: 1, name: /metrics, spatial analysis/i })).toBeVisible();
  await page.goto('/sources');
  await expect(page.getByRole('heading', { level: 1, name: /data source status/i })).toBeVisible();
  await page.goto('/pagina-che-non-esiste');
  await expect(page.getByRole('heading', { level: 1, name: /lost in the calli/i })).toBeVisible();
});

test('il catalogo dei layer dichiara la natura dei dati', async ({ page }) => {
  await page.goto('/layers');
  await expect(page.getByText(/opere pubbliche 2026/i).first()).toBeVisible();
});

test('layers, metriche e fonti mostrano lo stesso numero di layer', async ({ page }) => {
  const labels: string[] = [];
  for (const path of ['/layers', '/metrics', '/sources']) {
    await page.goto(path);
    labels.push((await page.locator('header').getByRole('link', { name: /\d+ layer/i }).first().innerText()).trim());
  }
  expect(new Set(labels).size).toBe(1);
});

test('la pagina Collega la tua AI mostra l\'indirizzo del server MCP', async ({ page }) => {
  await page.goto('/mcp');
  await expect(page.getByRole('heading', { level: 1, name: /collega la tua ai/i })).toBeVisible();
  await expect(page.getByText(/\/api\/mcp$/).first()).toBeVisible();
});

test('llms.txt descrive il sito e il server MCP', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toContain('/api/mcp');
  expect(text).toContain('fiber_coverage');
});

test.describe('API', () => {
  test('il server MCP si inizializza, elenca gli strumenti e risponde a una query', async ({ request }) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' };
    const rpc = async (id: number, method: string, params: Record<string, unknown> = {}) => {
      const res = await request.post('/api/mcp', { headers, data: { jsonrpc: '2.0', id, method, params } });
      expect(res.ok()).toBe(true);
      const text = await res.text();
      // risposta JSON oppure singolo evento SSE
      const json = text.trim().startsWith('{') ? JSON.parse(text) : JSON.parse(text.split('\n').find((l) => l.startsWith('data:'))!.slice(5));
      expect(json.error).toBeUndefined();
      return json.result;
    };
    const init = await rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } });
    expect(init.serverInfo.name).toBe('vod-venice-open-data');
    const tools = await rpc(2, 'tools/list');
    expect(tools.tools.map((t: { name: string }) => t.name).sort()).toEqual(['list_datasets', 'query_dataset']);
    const list = await rpc(3, 'tools/call', { name: 'list_datasets', arguments: {} });
    expect(JSON.parse(list.content[0].text).datasets.length).toBeGreaterThan(20);
    const q = await rpc(4, 'tools/call', { name: 'query_dataset', arguments: { dataset: 'canals', text: 'Canal Grande', limit: 3 } });
    const body = JSON.parse(q.content[0].text);
    expect(body.dataset.license).toMatch(/ODbL/);
    expect(body.returned).toBeGreaterThan(0);
    const near = await rpc(5, 'tools/call', { name: 'query_dataset', arguments: { dataset: 'fiber_coverage', near: { lat: 45.438, lon: 12.3358, radiusMeters: 200 }, limit: 5 } });
    const nearBody = JSON.parse(near.content[0].text);
    expect(nearBody.items[0].technology).toBe('FTTH');
    expect(nearBody.items[0].distanceMeters).toBeLessThanOrEqual(200);
  });

  test('il server MCP accetta le richieste preflight dei connettori web', async ({ request }) => {
    const res = await request.fetch('/api/mcp', { method: 'OPTIONS', headers: { Origin: 'https://claude.ai' } });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

  test('le sonde della laguna sono misure ARPAV con data di campionamento', async ({ request }) => {
    const body = await (await request.get('/api/regional-data')).json();
    expect(body.data.waterQuality.length).toBeGreaterThan(50);
    for (const st of body.data.waterQuality) expect(st.sampledAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.waterQualitySource.license).toBe('CC BY 4.0');
  });

  test('il punto pollini di Venezia include il calendario misurato da ARPAV', async ({ request }) => {
    const body = await (await request.get('/api/regional-data')).json();
    const ve = body.data.pollenStations.find((s: { id: string }) => s.id === 'POL_VENEZIA');
    expect(ve.measured.year).toBeGreaterThanOrEqual(2024);
    expect(ve.measured.families.urticaceae.mean).toHaveLength(12);
  });

  test('lagoon-network restituisce briccole e canali OpenStreetMap', async ({ request }) => {
    const body = await (await request.get('/api/lagoon-network')).json();
    expect(body.data.license).toBe('ODbL 1.0');
    expect(body.data.markers.length).toBeGreaterThan(1000);
    expect(body.data.canals.length).toBeGreaterThan(300);
  });

  test('city-assets include ecocentri e biblioteche da OpenStreetMap', async ({ request }) => {
    const body = await (await request.get('/api/city-assets')).json();
    for (const key of ['recyclingCentres', 'libraries']) {
      expect(body[key].length).toBeGreaterThan(0);
      for (const p of body[key]) expect(p.sourceUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\//);
    }
  });

  test('environment unisce medie ARPAV e previsione CAMS', async ({ request }) => {
    const body = await (await request.get('/api/environment')).json();
    expect(body.data.airStations.length).toBeGreaterThan(0);
    for (const st of body.data.airStations) {
      expect(typeof st.pm10 === 'number' || st.pm10 === null).toBe(true);
      if (st.forecast) expect(st.forecast.validTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    }
  });

  test('i pollini vengono dal modello o restano vuoti, mai valori di esempio', async ({ request }) => {
    const body = await (await request.get('/api/regional-data')).json();
    for (const st of body.data.pollenStations) {
      if (st.validTime === null) expect(st.pollens).toEqual([]);
      else expect(st.pollens.map((p: { key: string }) => p.key)).toEqual(['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed']);
    }
  });

  test('fiber restituisce le celle con attribuzione AGCOM', async ({ request }) => {
    const res = await request.get('/api/fiber');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.license).toBe('CC BY 4.0');
    expect(body.meta.attribution).toMatch(/BroadbandMap di Agcom/);
    expect(body.data.cells.length).toBeGreaterThan(1000);
  });

  test('wind-field restituisce una griglia completa o un errore esplicito', async ({ request }) => {
    const res = await request.get('/api/wind-field');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.success).toBe('boolean');
    if (body.success) {
      expect(body.data.u).toHaveLength(body.data.nx * body.data.ny);
      expect(body.data.validTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    }
  });

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
