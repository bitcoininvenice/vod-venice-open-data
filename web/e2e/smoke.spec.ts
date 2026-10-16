import { expect, test } from '@playwright/test';
import { SIM_URL } from '../src/lib/simulation-data';
import { FUEL_KINDS, fuelSummary } from '../src/lib/fuel';

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

test('la guida spiega pannello, scheda e scenari e parte da "Città"', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vod_onboarding_completed'));
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /avanti/i }).click();
  await expect(dialog.getByRole('heading', { name: /trova e attiva i livelli/i })).toBeVisible();
  await expect(dialog.getByText(/come si usa/i)).toBeVisible();
  await expect(dialog.getByText(/clicca un punto/i)).toBeVisible();
  await dialog.getByRole('button', { name: /avanti/i }).click();
  await expect(dialog.getByRole('heading', { name: /scegli da dove partire/i })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /città/i })).toHaveAttribute('aria-pressed', 'true');
  // alla prima visita la mappa parte già dallo scenario predefinito
  await expect(page).toHaveURL(/biblioteche/);
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
  await expect(menu.getByRole('menuitemradio', { name: /giorno/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('il pannello livelli si apre e mostra i gruppi', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Livelli', exact: true }).click();
  // il pannello esiste in due varianti (desktop e cassetto mobile): conta quella visibile
  await expect(page.getByText('Trasporti', { exact: true }).filter({ visible: true }).first()).toBeVisible();
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

test('menu uguale su desktop e mobile; su mobile in più ricerca, come arrivare e tema', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.getByRole('button', { name: isMobile ? /altre azioni/i : /menu strumenti/i }).click();
  const menu = page.getByRole('menu');
  const labels = await menu.locator('[role="menuitem"] .font-semibold').allTextContents();
  // voci comuni, nello stesso ordine
  const common = ['Funzionalità', 'Metriche', 'Fonti', 'Collega la tua AI', 'Esportazione dati', 'Lingua'];
  let last = -1;
  for (const c of common) {
    const i = labels.findIndex((l) => l.toLowerCase().includes(c.toLowerCase()));
    expect(i, c).toBeGreaterThan(last);
    last = i;
  }
  // l'analisi dei cantieri non è più nel menu: si apre dal suo livello
  expect(labels.some((l) => /incrocio|cantieri/i.test(l))).toBe(false);
  const extras = [labels.some((l) => /ricerca/i.test(l)), labels.some((l) => /come arrivare/i.test(l)), (await menu.getByRole('menuitemradio').count()) === 3];
  expect(extras).toEqual(isMobile ? [true, true, true] : [false, false, false]);
});

test('l\'analisi «fermate vicine ai cantieri» si apre dal livello Buffer spaziale cantieri', async ({ page, isMobile }) => {
  await page.goto('/?layers=buffer_spaziale');
  await page.locator('canvas').waitFor();
  if (isMobile) await page.getByRole('button', { name: 'Livelli', exact: true }).click();
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('buffer');
  await panel.getByTestId('open-spatial-analysis').click();
  await expect(page.locator('#spatial-modal-title')).toBeVisible();
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
  // vecchio nome di preset (link già condivisi): diventa lo scenario "Acqua alta"
  await page.goto('/?preset=lagoon');
  await expect(page).toHaveURL(/layers=.*mose/);
  expect(new URL(page.url()).searchParams.get('preset')).toBeNull();
  // ricaricando si ritrovano gli stessi layer, non il preset
  const layers = new URL(page.url()).searchParams.get('layers');
  await page.reload();
  expect(new URL(page.url()).searchParams.get('layers')).toBe(layers);
});

test('?layers=all non accende tutto: apre lo scenario predefinito', async ({ page }) => {
  await page.goto('/?layers=all');
  await expect(page).toHaveURL(/layers=.*biblioteche/);
  const layers = new URL(page.url()).searchParams.get('layers')!;
  expect(layers).not.toBe('all');
  expect(layers.split(',').length).toBeLessThanOrEqual(6);
});

/** Pannello dei livelli visibile (desktop o cassetto mobile). */
async function openLayerPanel(page: import('@playwright/test').Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Livelli', exact: true }).click();
  return page.locator('aside').filter({ visible: true }).first();
}

test('gli scenari accendono pochi livelli e si evidenziano', async ({ page, isMobile }) => {
  await page.goto('/');
  const panel = await openLayerPanel(page, isMobile);
  const servizi = panel.getByRole('button', { name: /servizi utili/i });
  await servizi.click();
  await expect(servizi).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/layers=[^&]*farmacie/);
  await expect(page).toHaveURL(/dae_pubblici/);
  // nessun pulsante "Tutti"
  await expect(panel.getByRole('button', { name: /^tutti$/i })).toHaveCount(0);
});

test('la ricerca nel pannello filtra i livelli', async ({ page, isMobile }) => {
  await page.goto('/');
  const panel = await openLayerPanel(page, isMobile);
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('farmac');
  const pharmacies = panel.locator('[data-layer="showPharmacies"]');
  await expect(pharmacies).toBeVisible();
  await expect(panel.locator('[data-layer="showShips"]')).toHaveCount(0);
  await pharmacies.click();
  await expect(pharmacies).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/layers=[^&]*farmacie/);
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('xyzxyz');
  await expect(panel.getByText(/nessun livello per/i)).toBeVisible();
});

test('troppi livelli: avviso con "Pulisci"', async ({ page, isMobile }) => {
  await page.goto('/');
  const panel = await openLayerPanel(page, isMobile);
  await panel.getByRole('button', { name: /attiva i livelli verificati di trasporti/i }).click();
  await panel.getByRole('button', { name: /attiva i livelli verificati di ambiente/i }).click();
  const warning = panel.getByRole('status').filter({ hasText: /livelli accesi/i });
  await expect(warning).toBeVisible();
  await warning.getByRole('button', { name: /pulisci/i }).click();
  await expect(warning).toBeHidden();
  await expect(page).not.toHaveURL(/layers=/);
});

test('legenda dei livelli attivi: si apre e spegne un livello', async ({ page }) => {
  await page.goto('/?layers=farmacie,dae_pubblici');
  const legend = page.getByRole('button', { name: /mostra i livelli attivi/i });
  await legend.click();
  await page.getByRole('button', { name: /disattiva defibrillatori|disattiva dae/i }).first().click();
  await expect(page).not.toHaveURL(/dae_pubblici/);
  await expect(page).toHaveURL(/layers=[^&]*farmacie/);
});

test('metriche: sezione delle opere pubbliche dal monitoraggio BDAP', async ({ page }) => {
  await page.goto('/metrics');
  const section = page.getByTestId('public-works-monitor');
  await expect(section).toBeVisible();
  await expect(section.getByText(/lavori in corso più costosi/i)).toBeVisible();
});

test('consumi: all\'avvio a mappa pulita partono solo marea e meteo, le altre API con il loro livello', async ({ page }) => {
  const api: string[] = [];
  const data: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/')) api.push(u.pathname);
    if (u.pathname.startsWith('/data/')) data.push(u.pathname);
  });
  await page.goto('/');
  await page.waitForTimeout(2500);
  // marea nell'intestazione, meteo per la temperatura nella barra dell'orario
  expect([...api].sort()).toEqual(['/api/tide', '/api/weather']);
  // la simulazione dei mezzi non si scarica (le isole dettagliate sì, se la vista è già ravvicinata)
  expect(data.filter((d) => d.startsWith('/data/sim-'))).toEqual([]);
  // accendere le farmacie carica solo la loro API
  await page.goto('/?layers=farmacie_turno');
  await expect.poll(() => api.includes('/api/emergency-health')).toBe(true);
  expect(api).not.toContain('/api/cameras');
  // i mezzi ACTV scaricano la simulazione statica
  await page.goto('/?preset=muoversi');
  await expect.poll(() => data.some((d) => /^\/data\/sim-[0-9a-f]{12}\.json$/.test(d))).toBe(true);
});

test('i clic sulla legenda dei livelli attivi non arrivano alla mappa sotto', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  // La copertura fibra riempie le zone abitate: un clic che arriva alla mappa apre la scheda di una cella.
  const fiber = page.waitForResponse((r) => r.url().includes('/api/fiber'));
  await page.goto('/?layers=copertura_fibra');
  await fiber;
  const legend = page.getByRole('button', { name: /mostra i livelli attivi/i });
  await expect(legend).toBeVisible();
  const info = page.locator('[data-info-panel]');
  let checked = false;
  for (const view of [/^mestre$/i, /^venezia$/i]) {
    await page.getByRole('button', { name: view }).first().click();
    await page.waitForTimeout(800);
    const box = (await legend.boundingBox())!;
    const y = box.y + box.height / 2;
    // controllo positivo: senza legenda, in un punto della sua fascia la mappa apre la scheda di una cella
    const hide = await page.addStyleTag({ content: 'div:has(> div > [aria-label="Mostra i livelli attivi"]){display:none}' });
    let hitX: number | null = null;
    for (let x = box.x + 20; x < box.x + box.width - 10 && hitX === null; x += 40) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(150);
      if (await info.count()) hitX = x;
    }
    await hide.evaluate((el) => (el as Element).remove());
    if (hitX === null) continue;
    await page.keyboard.press('Escape');
    await expect(info).toHaveCount(0);
    // con la legenda visibile lo stesso clic resta alla legenda
    await page.mouse.click(hitX, y);
    await page.waitForTimeout(300);
    await expect(info).toHaveCount(0);
    checked = true;
    break;
  }
  expect(checked, 'nessuna vista con una cella di fibra sotto la legenda').toBe(true);
});

test('barra dell\'orario: temperatura del centro storico accanto ad alba e tramonto', async ({ page }) => {
  await page.route('**/api/weather', async (route) => {
    const res = await route.fetch();
    const json = await res.json();
    json.data.cityTemp = { celsius: 16.9, humidityPercent: 80, stationId: '1026', stationName: 'Palazzo Cavalli', observedAt: '2026-10-10 09:40:00' };
    await route.fulfill({ response: res, json });
  });
  await page.goto('/');
  const temp = page.getByTestId('timeline-air-temp');
  await expect(temp).toContainText('16,9°');
  await expect(page.getByTestId('timeline-humidity')).toHaveText('80% umidità');
  await expect(temp).toHaveAttribute('title', /umidità.*Palazzo Cavalli.*09:40/);
});

test('ritardi ACTV: scheda del mezzo e prossimi arrivi alla fermata', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  const now = Math.floor(Date.now() / 1000);
  // Una corsa feriale reale della linea 2 dall'orario della simulazione (per evidenziarne il percorso)
  const sim = await (await page.request.get(SIM_URL)).json();
  const route2 = sim.routes.findIndex((r: { n: string }) => r.n === '2');
  const trip2 = sim.days.weekday.trips.find(([p, t]: [number, number]) => sim.profiles[p][1] === route2 && t >= 6 * 3600 && t < 22 * 3600) as [number, number];
  const hms = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  // Dati in tempo reale simulati: un vaporetto della linea 2 in ritardo di 4 minuti, fermo a Rialto
  await page.route('**/api/realtime/vehicles', (route) =>
    route.fulfill({
      json: {
        ok: true,
        count: 1,
        meta: {},
        data: [{
          id: 'test-1', tripId: 'NAV_ACTV_653_1', routeId: '2_UN', label: null, ...RIALTO, bearing: 0, timestamp: now,
          startTime: hms(trip2[1]), startDate: '20261012', // lunedì: orario feriale
          network: 'navigazione', line: '2', category: 'vaporetto',
          delay: { seconds: 240, status: 'late', updatedAt: now - 5, nextStopId: '5038', nextStopName: 'Rialto "A"', nextStopTime: now + 120, estimate: 'predicted', source: 'position', actvSeconds: 180 },
        }],
      },
    })
  );
  await page.route('**/api/servizio', (route) =>
    route.fulfill({
      json: {
        success: true, count: 1, meta: {},
        data: [{ line: '2', category: 'vaporetto', network: 'navigazione', gps: 15, scheduled: 17, withoutGps: 2, withDelay: 12, avgDelayS: 126, maxDelayS: 605, onTimeShare: 0.5,
          bunched: [{ a: 'test-1', b: 'test-2', terminus: 'Lido S.M.E.', headwayS: 600, gapS: 90 }] }],
      },
    })
  );
  let arrivalsQuery = '';
  await page.route('**/api/realtime/arrivals?*', (route) => {
    arrivalsQuery = new URL(route.request().url()).search;
    return route.fulfill({
      json: {
        success: true, count: 1, meta: {},
        data: [{ line: '2', routeLongName: 'P.le Roma - Rialto', color: null, stopName: 'Rialto "C"', time: now + 300, delaySeconds: 240, status: 'late', estimate: 'predicted', updatedAt: now - 5 }],
      },
    });
  });
  await page.goto('/?layers=vaporetti_realtime');
  await page.locator('canvas').waitFor();
  // la ricerca centra la mappa sulla fermata e ne apre la scheda
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /^.*rialto/i }).first().click();
  const info = page.locator('[data-info-panel]');
  await expect(info.getByTestId('realtime-arrivals')).toContainText('In ritardo di 4 min');
  expect(arrivalsQuery).toContain('stops=5038'); // la fermata usa i codici GTFS ufficiali
  // ultime partenze di oggi dall'orario ufficiale
  const last = info.getByTestId('last-departures');
  await expect(last).toContainText('Ultime partenze di oggi');
  await expect(last.locator('li').first()).toContainText(/\d{2}:\d{2}/);
  await page.keyboard.press('Escape');
  // spente le fermate, al centro della mappa resta solo il vaporetto
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  await expect(panel.locator('[data-layer="showStops"]')).toHaveAttribute('aria-pressed', 'false');
  const box = (await page.locator('canvas').boundingBox())!;
  // anello giallo (in ritardo 3-5 min) attorno al vaporetto, a 10 px dal centro
  await page.waitForTimeout(300);
  const ringPixels = await page.locator('canvas').evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!;
    const dpr = c.width / c.clientWidth;
    const cx = c.width / 2, cy = c.height / 2;
    let amber = 0;
    for (let a = 0; a < 360; a += 15) {
      const x = Math.round(cx + Math.cos((a * Math.PI) / 180) * 10 * dpr);
      const y = Math.round(cy + Math.sin((a * Math.PI) / 180) * 10 * dpr);
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      if (r > 200 && g > 120 && g < 190 && b < 60) amber++;
    }
    return amber;
  });
  expect(ringPixels).toBeGreaterThan(12);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(info).toContainText('In ritardo di 4 min');
  await expect(info).toContainText('Prossima fermata: Rialto');
  await expect(info).toContainText('stima ACTV');
  // fonte del ritardo: calcolato dalla posizione, con il dato ACTV come verifica
  await expect(info.getByTestId('delay-source')).toContainText('Calcolato dalla posizione GPS');
  await expect(info.getByTestId('delay-source')).toContainText('ACTV indica +3 min');
  // la linea adesso: mezzi, ritardi e il mezzo in coda con un altro della stessa linea
  const lineNow = info.getByTestId('line-now');
  await expect(lineNow).toContainText('Linea 2 adesso');
  await expect(lineNow).toContainText('15 mezzi con GPS su 17 corse');
  await expect(lineNow.getByTestId('bunched-warning')).toContainText('a 2 min da un altro mezzo della linea verso Lido S.M.E.');
  // fermate della corsa, dall'orario ufficiale, con la corsa evidenziata sulla mappa
  const stops = info.getByTestId('trip-stops');
  await expect(stops).toContainText('Fermate della corsa');
  expect(await stops.locator('li').count()).toBeGreaterThan(3);
  // la linea 2 serve sempre San Marco o Piazzale Roma, secondo la variante
  await expect(stops).toContainText(/S\. Marco|P\.le Roma/);
});

test('colori ufficiali delle linee ACTV nella scheda della fermata', async ({ page }) => {
  await page.goto('/?layers=fermate');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /^.*rialto/i }).first().click();
  const info = page.locator('[data-info-panel]');
  // la linea 2 è rossa (#FF0000 nel GTFS di ACTV); l'orario della fermata si carica dopo l'apertura della scheda
  const line2 = info.getByText(/^Linea 2$/).first();
  await expect(line2).toBeVisible({ timeout: 15000 });
  await expect(line2).toHaveCSS('background-color', 'rgb(255, 0, 0)');
});

test('ricerca per numero civico: «Cannaregio …» porta al portone o al civico più vicino', async ({ page }) => {
  // un civico reale presente su OSM, preso dall'API dei dataset
  const res = await page.request.get('/api/datasets/house_numbers?text=Cannaregio&limit=1');
  const civ = (await res.json()).items[0];
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/civico/i).fill(civ.label);
  const dialog = page.getByRole('dialog', { name: /ricerca/i });
  await dialog.getByRole('button').filter({ hasText: civ.label }).first().click();
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText(civ.label);
  await expect(info).toContainText('Civico presente su OpenStreetMap');
});

test('come arrivare: da Ferrovia a Murano in vaporetto, con l\'itinerario sulla mappa', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  // partenza fissa alle 10:00: a tarda sera alcune linee non hanno più corse
  await panel.locator('input[type="time"]').fill('10:00');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Ferrovia');
  await panel.getByRole('button', { name: /^Ferrovia$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  // Murano non è raggiungibile a piedi: serve almeno una corsa, con l'orario e la direzione
  const result = panel.getByTestId('planner-result');
  await expect(result).toBeVisible({ timeout: 15000 });
  await expect(result).toContainText('Murano Colonna');
  await expect(result).toContainText(/direzione .* fermate/);
  await expect(result).toContainText(/\d{2}:\d{2} → \d{2}:\d{2}/);
});

test('come arrivare dopo aver aperto una fermata: nessun errore (cache delle fermate per elenco)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('canvas').waitFor();
  // la scheda della fermata calcola le ultime partenze su tutte le fermate della mappa
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await expect(page.locator('[data-info-panel]').getByTestId('last-departures').locator('li').first()).toBeVisible({ timeout: 15000 });
  await page.keyboard.press('Escape');
  // poi il planner, che usa solo i pontili
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.locator('input[type="time"]').fill('10:00');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Ferrovia');
  await panel.getByRole('button', { name: /^Ferrovia$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  await expect(panel.getByTestId('planner-result')).toBeVisible({ timeout: 15000 });
  expect(errors).toEqual([]);
});

test('come arrivare: modalità solo a piedi e preferisci via acqua', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  // partenza fissa alle 10:00: a tarda sera alcune linee non hanno più corse
  await panel.locator('input[type="time"]').fill('10:00');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Ferrovia');
  await panel.getByRole('button', { name: /^Ferrovia$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  await expect(panel.getByTestId('planner-result')).toBeVisible({ timeout: 15000 });
  // Murano non si raggiunge solo a piedi
  await panel.getByRole('radio', { name: 'Solo a piedi' }).click();
  await expect(panel.getByRole('radio', { name: 'Solo a piedi' })).toHaveAttribute('aria-checked', 'true');
  await expect(panel.getByTestId('planner-result')).toBeHidden();
  await expect(panel).toContainText('Nessun percorso trovato');
  await panel.getByRole('radio', { name: 'Preferisci via acqua' }).click();
  await expect(panel.getByTestId('planner-result')).toContainText(/direzione .* fermate/);
});

test('come arrivare da un indirizzo: suggerimenti dal gazzettiere OSM', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('cannaregio calle minestra');
  await panel.getByTestId('planner-address-option').first().click();
  await expect(panel.getByTestId('planner-from')).toContainText('Calle Minestra');
});

test('ricerca: indirizzi e fermate Alilaguna tra i risultati', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: /ricerca/i });
  await page.getByPlaceholder(/cerca fermate/i).fill('calle minestra');
  await expect(dialog.getByRole('button').filter({ hasText: 'Indirizzo (OpenStreetMap)' }).first()).toBeVisible();
  await page.getByPlaceholder(/cerca fermate/i).fill('Tronchetto');
  const alilaguna = dialog.getByRole('button').filter({ hasText: 'Fermata Alilaguna' }).first();
  await expect(alilaguna).toBeVisible();
  await alilaguna.click();
  await expect(dialog).toBeHidden();
});

test('come arrivare all\'aeroporto: opzioni Alilaguna e ACTV con il bus 5', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.locator('input[type="time"]').fill('10:00');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Ferrovia');
  await panel.getByRole('button', { name: /^Ferrovia$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('aeroporto');
  await panel.getByTestId('planner-airport-option').click();
  await expect(panel.getByTestId('planner-to')).toContainText('Aeroporto Marco Polo (VCE)');
  const options = panel.getByTestId('planner-airport-options');
  await expect(options).toBeVisible({ timeout: 15000 });
  // ACTV c'è sempre; Alilaguna solo nella validità stagionale dell'orario importato
  await options.getByTestId('planner-airport-actv').click();
  await expect(options.getByTestId('planner-airport-actv')).toHaveAttribute('aria-checked', 'true');
  await expect(panel.getByTestId('planner-result')).toContainText('Bus ACTV');
  await expect(panel.getByTestId('planner-result')).toContainText('Piazzale Roma');
  await expect(panel.getByTestId('planner-airport-note')).toContainText('Alilaguna');
});

test('come arrivare «adesso»: l\'itinerario si aggiorna e non propone una corsa già partita', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  // mercoledì 14/10/2026 alle 23:52 a Venezia: l'ultima 4.2 da Murano Colonna parte alle 23:54
  await page.clock.install({ time: new Date('2026-10-14T21:52:00Z') });
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('aeroporto');
  await panel.getByTestId('planner-airport-option').click();
  const result = panel.getByTestId('planner-result');
  await expect(result).toContainText('23:54', { timeout: 15000 });
  // tre minuti dopo la 4.2 delle 23:54 è partita: l'itinerario cambia senza toccare nulla
  await page.clock.fastForward('03:00');
  await expect(result).not.toContainText('23:54', { timeout: 15000 });
});

test('come arrivare con tutti i mezzi: alternative con ACTV e Alilaguna, si sceglie quella da vedere', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  // mercoledì 14/10/2026 alle 10:00, dentro la stagione dell'orario Alilaguna
  await page.clock.install({ time: new Date('2026-10-14T08:00:00Z') });
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Lido S.M.E.');
  await panel.getByRole('button', { name: /^Lido S\.M\.E\.$/ }).click();
  // verso Murano Colonna la soluzione è l'Alilaguna Blu diretta
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).first().click();
  await expect(panel.getByTestId('planner-result')).toContainText('Alilaguna', { timeout: 15000 });
  // verso il Tronchetto due alternative ACTV (con un cambio o senza), da scegliere
  await panel.getByTestId('planner-to').getByRole('button', { name: 'cambia' }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Tronchetto');
  await panel.getByRole('button', { name: /^Tronchetto$/ }).first().click();
  const options = panel.getByTestId('planner-options');
  await expect(options).toBeVisible({ timeout: 15000 });
  const radios = options.getByRole('radio');
  expect(await radios.count()).toBeGreaterThanOrEqual(2);
  await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  await radios.last().click();
  await expect(radios.last()).toHaveAttribute('aria-checked', 'true');
  await expect(panel.getByTestId('planner-result')).toContainText(/\d{2}:\d{2} → \d{2}:\d{2}/);
});

test('privacy raggiungibile dalla mappa e avvertenza del simulatore di marea', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await expect(page.getByTestId('map-attribution').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  await page.goto('/?open=tide&marea=130');
  await expect(page.getByTestId('simulator-disclaimer')).toContainText('non è il bollettino del Centro Maree');
  await page.goto('/privacy');
  await expect(page.locator('body')).toContainText('registri di funzionamento e sicurezza');
  await expect(page.locator('body')).toContainText('server MCP');
});

test('come arrivare: costo stimato del percorso per tipo di biglietto, con la fonte delle tariffe', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/?open=planner&da=45.44120,12.32150&daNome=Ferrovia&a=45.45470,12.35040&aNome=Murano%20Colonna&ora=10:00');
  const panel = page.locator('[data-info-panel]');
  const cost = panel.getByTestId('planner-cost');
  await expect(cost).toContainText('Costo stimato: ≈ 9,50 €', { timeout: 15000 });
  await expect(cost).toContainText('rete unica 75′');
  await expect(cost.getByRole('link', { name: 'ACTV' })).toHaveAttribute('href', /prezzi-vigore/);
  await panel.getByTestId('planner-fare-profile').getByRole('radio', { name: 'Venezia Unica' }).click();
  await expect(cost).toContainText('Costo stimato: ≈ 1,50 €');
  await panel.getByTestId('planner-fare-profile').getByRole('radio', { name: 'Abbonamento ACTV' }).click();
  await expect(cost).toContainText('Costo stimato: gratis');
});

test('i link delle risposte della skill aprono il planner già compilato e il simulatore al livello indicato', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/?open=planner&da=45.44120,12.32150&daNome=Ferrovia&a=45.45470,12.35040&aNome=Murano%20Colonna&ora=10:00');
  const panel = page.locator('[data-info-panel]');
  await expect(panel.getByTestId('planner-from')).toContainText('Ferrovia');
  await expect(panel.getByTestId('planner-to')).toContainText('Murano Colonna');
  await expect(panel.locator('input[type="time"]')).toHaveValue('10:00');
  await expect(panel.getByTestId('planner-result')).toBeVisible({ timeout: 15000 });
  await page.goto('/?open=tide&marea=130');
  await expect(page.getByText(/\+?130\s*cm/).first()).toBeVisible({ timeout: 15000 });
});

test('come arrivare di corsa: mostra la corsa che sta per partire con l\'avviso «Sbrigati»', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  // 23:53:30 a Venezia: l'ultima 4.2 da Murano Colonna parte alle 23:54, troppo presto per il margine normale
  await page.clock.install({ time: new Date('2026-10-14T21:53:30Z') });
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('aeroporto');
  await panel.getByTestId('planner-airport-option').click();
  const hurry = panel.getByTestId('planner-hurry');
  await expect(hurry).toBeVisible({ timeout: 15000 });
  await expect(hurry).toContainText('Sbrigati');
  await expect(hurry).toContainText('4.2');
  await expect(hurry).toContainText('23:54');
  await expect(hurry).toContainText('Se non fai in tempo');
});

test('come arrivare in barca propria: ZTL solo per residenti, percorso sui canali con le regole del Testo Unico', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.getByTestId('open-planner').click();
  const panel = page.locator('[data-info-panel]');
  await panel.locator('input[type="time"]').fill('14:00');
  await panel.getByTestId('planner-from').getByRole('textbox').fill('Ferrovia');
  await panel.getByRole('button', { name: /^Ferrovia$/ }).click();
  await panel.getByTestId('planner-to').getByRole('textbox').fill('Murano Colonna');
  await panel.getByRole('button', { name: /^Murano Colonna$/ }).click();
  await panel.getByRole('radio', { name: 'In barca (mezzo privato)' }).click();
  // la Ferrovia è sul Canal Grande, nella ZTL: senza residenza o concessione il diporto non può circolarci
  await expect(panel.getByTestId('planner-boat-options')).toContainText('ZTL');
  await expect(panel.getByTestId('planner-boat-error')).toContainText('ZTL', { timeout: 15000 });
  await panel.getByTestId('planner-boat-resident').check();
  const result = panel.getByTestId('planner-boat-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/\d{2}:\d{2} → \d{2}:\d{2}/);
  await expect(result.getByTestId('planner-boat-canals').locator('li').first()).toBeVisible();
  await expect(result).toContainText('non valido per la navigazione');
  await expect(result.getByRole('link', { name: 'Normativa del Comune' })).toHaveAttribute('href', /comune\.venezia\.it/);
  expect(errors).toEqual([]);
});

test('come arrivare qui dalla scheda della fermata imposta la destinazione', async ({ page }) => {
  await page.goto('/?layers=fermate');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /^.*rialto/i }).first().click();
  const info = page.locator('[data-info-panel]');
  await info.getByTestId('plan-here').click();
  await expect(info.getByTestId('planner-to')).toContainText('Rialto');
});

test('nautica: il clic su una marina apre la sua scheda', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  await page.route('**/api/nautical', (route) =>
    route.fulfill({
      json: {
        success: true, count: 1, meta: {},
        data: [{ id: 'node/1', kind: 'marina', name: 'Marina di prova', access: null, capacity: 120, operator: 'Comune', openingHours: null, website: null, zone: 'Venezia centro storico', ...RIALTO, sourceUrl: 'https://www.openstreetmap.org/node/1' }],
      },
    })
  );
  await page.goto('/?layers=nautica');
  await page.locator('canvas').waitFor();
  // centra la mappa sulle coordinate della marina passando dalla ricerca, poi spegne le fermate
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText('Marina di prova');
  await expect(info).toContainText('120 posti');
  await expect(info).toContainText('OpenStreetMap');
});

test('scheda dell\'aeroporto: collegamenti dei prossimi 90 minuti, partenze e arrivi', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/?open=aeroporto');
  const board = page.getByTestId('airport-board');
  await expect(board).toBeVisible({ timeout: 15000 });
  await expect(board.getByRole('tab', { name: /Partenze/ })).toHaveAttribute('aria-selected', 'true');
  await board.getByRole('tab', { name: /Arrivi/ }).click();
  await expect(board.getByRole('tab', { name: /Arrivi/ })).toHaveAttribute('aria-selected', 'true');
  await expect(board).toContainText('veneziaairport.it');
});

test('vicino all\'aeroporto le icone si cliccano prima dell\'area dell\'aeroporto', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/?layers=alilaguna');
  await page.locator('canvas').waitFor();
  // la ricerca centra la mappa sulla darsena Alilaguna dell'aeroporto
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Aeroporto (A)');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: 'Fermata Alilaguna' }).first().click();
  await expect(page.locator('#alilaguna-modal-title')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#alilaguna-modal-title')).toBeHidden();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // si apre la scheda della darsena o della barca Alilaguna ormeggiata lì (secondo l'ora), non quella dell'aeroporto
  const alilagunaCard = page.locator('#alilaguna-modal-title').or(page.getByRole('dialog', { name: /^Linea (Blu|Arancio|Rossa)/ }));
  await expect(alilagunaCard.first()).toBeVisible();
  await expect(page.locator('#airport-modal-title')).toHaveCount(0);
});

test('parchi: il clic dentro l\'area di un parco apre la sua scheda', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  const d = 0.0015;
  const ring = [
    [RIALTO.lon - d, RIALTO.lat - d], [RIALTO.lon + d, RIALTO.lat - d], [RIALTO.lon + d, RIALTO.lat + d],
    [RIALTO.lon - d, RIALTO.lat + d], [RIALTO.lon - d, RIALTO.lat - d],
  ];
  await page.route('**/api/parks', (route) =>
    route.fulfill({
      json: {
        success: true, count: 1, meta: {},
        data: [{ id: 'osm-way-1', osmUrl: 'https://www.openstreetmap.org/way/1', name: 'Parco di prova', kind: 'park', access: 'public', areaM2: 77000, ...RIALTO, rings: [ring], openingHours: 'Mo-Su 08:00-20:00', operator: null, wheelchair: 'yes', dog: 'leashed', lit: null, website: null }],
      },
    })
  );
  await page.goto('/?layers=parchi_giardini');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  const box = (await page.locator('canvas').boundingBox())!;
  // un punto dentro il poligono ma lontano dal centro: il clic usa l'area, non un raggio attorno al punto
  await page.mouse.click(box.x + box.width / 2 + 12, box.y + box.height / 2 - 12);
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText('Parco di prova');
  await expect(info).toContainText('7,7 ettari');
  await expect(info).toContainText('al guinzaglio');
  await expect(info).toContainText('OpenStreetMap');
});

test('ordinanze del Comune: il segnale sulla mappa apre la scheda con l\'atto', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  await page.route('**/api/ordinanze', (route) =>
    route.fulfill({
      json: {
        success: true, meta: {},
        data: [
          { id: '9001', number: '700', date: '2026-10-07', title: 'Cantiere per il restauro di Ponte di prova', ambito: 'LLPP Venezia e Isole', luogo: 'Venezia Città Storica',
            validFrom: '2026-10-07', validTo: '2099-10-31', status: 'active', kind: 'works', canalName: null, placeName: 'Ponte di prova', ...RIALTO,
            positionSource: 'place', url: 'https://www.comune.venezia.it/it/content/ordinanza?idPratica=9001', pdfUrl: 'https://gwapi.sad.ve.it/ve/ordinanze/1.0.0/download/1' },
          { id: '9002', number: '701', date: '2026-10-08', title: 'Misure per il concerto', ambito: 'Viabilità', luogo: 'Venezia Città Storica',
            validFrom: null, validTo: null, status: 'unverified', kind: 'event', canalName: null, placeName: null, lat: null, lon: null,
            positionSource: null, url: 'https://www.comune.venezia.it/it/content/ordinanza?idPratica=9002', pdfUrl: null },
        ],
      },
    })
  );
  await page.goto('/?layers=ordinanze_comune');
  await page.locator('canvas').waitFor();
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('ordinanze');
  const unplaced = panel.getByTestId('unplaced-ordinances');
  await unplaced.getByText('Atti in vigore senza posizione sulla mappa: 1').click();
  await expect(unplaced).toContainText('Misure per il concerto');
  await expect(unplaced.getByRole('link', { name: /Ordinanza n\. 701/ })).toHaveAttribute('href', /idPratica=9002/);
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const info = page.locator('[data-info-panel]');
  await expect(info.getByTestId('ordinance-card')).toContainText('Cantiere per il restauro di Ponte di prova');
  await expect(info).toContainText('Ponte di prova');
  await expect(info.getByRole('link', { name: /Ordinanza n\. 700 del 07\/10\/2026/ })).toHaveAttribute('href', /idPratica=9001/);
  await expect(info).toContainText('Fa fede il testo');
});

test('la scheda informativa non copre il pannello livelli e non blocca la mappa', async ({ page, isMobile }) => {
  test.skip(isMobile, 'su mobile la scheda è un cassetto dal basso');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  const info = page.locator('[data-info-panel]');
  await expect(info).toBeVisible();
  await expect(info).toHaveAttribute('aria-modal', 'false');
  const infoBox = (await info.boundingBox())!;
  const panelBox = (await page.locator('aside').filter({ visible: true }).first().boundingBox())!;
  expect(infoBox.x).toBeGreaterThan(panelBox.x + panelBox.width);
  // piede con natura del dato e link alla scheda del livello
  await expect(info.getByRole('link', { name: /scheda del livello/i })).toHaveAttribute('href', /\/layers#fermate_actv/);
  await page.keyboard.press('Escape');
  await expect(info).toBeHidden();
});

test('fermate bus: il clic apre la scheda con linee e orari ufficiali della fermata', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const STOP = { lat: 45.43727, lon: 12.335071 };
  await page.route('**/api/avvisi-actv', (route) =>
    route.fulfill({
      json: {
        success: true, meta: {},
        data: [
          { id: '1', title: 'Fermata spostata di prova', url: 'https://actv.avmspa.it/it/content/prova', publishedAt: '2026-10-13T09:00:00.000Z', text: 'La fermata ID 4568 viene spostata.', lines: [], stops: [{ id: '4568', name: 'Fermata di prova', lat: 45.43727, lon: 12.335071, match: 'id' }], lastDate: null, openEnded: true },
          { id: '2', title: 'Deviazione linea B', url: 'https://actv.avmspa.it/it/content/prova-2', publishedAt: '2026-10-12T09:00:00.000Z', text: 'La linea B è deviata.', lines: ['B'], stops: [], lastDate: '2099-01-01', openEnded: false },
        ],
      },
    }),
  );
  await page.route('**/api/fermate-bus', (route) =>
    route.fulfill({ json: { success: true, count: 1, meta: {}, data: [{ id: 'busstop:4567', name: 'Fermata di prova', ...STOP, mode: 'bus', lines: ['A', 'B'], gtfsIds: ['4567', '4568'] }] } }),
  );
  await page.goto('/?layers=fermate_bus');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText('Fermata di prova');
  await expect(info).toContainText('Linea B');
  await expect(info.getByRole('link', { name: /orari ufficiali di questa fermata/i })).toHaveAttribute('href', /stopid=4567&service=AUT/);
  // avvisi ACTV: quello sulla fermata (per codice) e quello sulla linea
  const notices = info.getByTestId('actv-notices');
  await expect(notices).toContainText('Fermata spostata di prova');
  await expect(notices).toContainText('Deviazione linea B');
});

test('flixbus: il bus simulato dall\'orario si clicca e mostra linea, prossima fermata e licenza', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  const now = new Date();
  const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const sec = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60;
  // corsa di prova ferma a "Rialto" per tutta la durata del test
  await page.route('**/api/flixbus', (route) =>
    route.fulfill({
      json: {
        success: true, count: 1, meta: {},
        data: {
          trips: [{ id: 't1', line: '536', name: 'Roma - Monaco', from: 'Roma', to: 'Monaco', start: sec - 7200, end: sec + 18000, dates: [ymd], shape: 0,
            stops: [[0, sec - 600, sec + 1800, 'Fermata di prova', true], [5000, sec + 3600, sec + 3700, 'Padua', false]] }],
          shapes: [[[RIALTO.lon, RIALTO.lat, 0], [RIALTO.lon + 0.06, RIALTO.lat, 5000]]],
        },
      },
    }),
  );
  await page.goto('/?layers=flixbus');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('fermate');
  await panel.locator('[data-layer="showStops"]').click();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText('FlixBus 536');
  await expect(info).toContainText('Roma → Monaco');
  await expect(info).toContainText('Fermata di prova');
  await expect(info).toContainText('Partenza da Roma');
  await expect(info).toContainText('Arrivo a Monaco');
  await expect(info.getByTestId('flixbus-stops').locator('li')).toHaveCount(2);
  await expect(info).toContainText('ODbL');
});

test('carburanti: distributori colorati per prezzo, scelta del carburante e scheda con la fonte', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  const recent = new Date(Date.now() - 3600_000).toISOString();
  const station = (id: string, lat: number, lon: number, benzina: number, gasolio: number) => ({
    id, lat, lon, brand: id === '1' ? 'Api-Ip' : 'Agip Eni', address: `Via di prova ${id}`, comune: 'VENEZIA', highway: false,
    prices: [
      { fuel: 'Benzina', self: true, price: benzina, communicatedAt: recent },
      { fuel: 'Gasolio', self: true, price: gasolio, communicatedAt: recent },
    ],
  });
  await page.route('**/api/carburanti', (route) =>
    route.fulfill({
      json: {
        success: true, count: 2, meta: { license: 'IODL 2.0' },
        // a Rialto il più economico per la benzina e il più caro per il gasolio
        data: [station('1', RIALTO.lat, RIALTO.lon, 1.799, 1.999), station('2', RIALTO.lat + 0.02, RIALTO.lon, 1.899, 1.799)],
      },
    }),
  );
  await page.goto('/?layers=carburanti');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('carburante');
  await expect(panel.getByRole('group', { name: 'Carburante da confrontare' })).toBeVisible();
  await expect(panel).toContainText('più economico');
  const box = (await page.locator('canvas').boundingBox())!;
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.click(center.x, center.y);
  const info = page.locator('[data-info-panel]');
  await expect(info).toContainText('Api-Ip');
  await expect(info).toContainText('Via di prova 1 · VENEZIA');
  await expect(info).toContainText('Benzina: 1° più economico su 2 distributori');
  await expect(info.getByTestId('fuel-prices').locator('tbody tr')).toHaveCount(2);
  await expect(info).toContainText('IODL 2.0');
  await page.keyboard.press('Escape');
  await panel.getByRole('button', { name: 'Gasolio' }).click();
  await page.mouse.click(center.x, center.y);
  await expect(info).toContainText('Gasolio: 2° più economico su 2 distributori');
  // dal distributore si apre il planner con il distributore come arrivo
  await info.getByTestId('plan-here').click();
  await expect(page.locator('[data-info-panel]').getByTestId('planner-to')).toContainText('Api-Ip – Via di prova 1');
});

test('carburanti senza prezzi del Ministero: distributori OpenStreetMap in grigio, con carburanti, orari e barche', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  const RIALTO = { lat: 45.43727, lon: 12.335071 };
  await page.route('**/api/carburanti', (route) =>
    route.fulfill({
      json: {
        success: true, count: 1, summary: null, meta: { pricesAvailable: false, license: 'ODbL 1.0' },
        data: [{ id: 'osm-node-1', lat: RIALTO.lat, lon: RIALTO.lon, brand: 'IP', address: '', comune: '', highway: false, prices: [],
          osm: { url: 'https://www.openstreetmap.org/node/1', fuels: ['Benzina', 'Gasolio'], boat: true, openingHours: 'Mo-Sa 07:30-12:30' } }],
      },
    }),
  );
  await page.goto('/?layers=carburanti');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Rialto');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /rialto/i }).first().click();
  await page.keyboard.press('Escape');
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const info = page.locator('[data-info-panel]');
  await expect(info.getByTestId('fuel-no-prices')).toContainText('Prezzi non disponibili');
  await expect(info).toContainText('Benzina, Gasolio');
  await expect(info).toContainText('distributore anche per barche');
  await expect(info.getByRole('link', { name: /OpenStreetMap contributors/ })).toHaveAttribute('href', 'https://www.openstreetmap.org/node/1');
});

test('metrics: prezzi dei carburanti per zona, con il più economico e il più caro', async ({ page }) => {
  const recent = new Date(Date.now() - 3600_000).toISOString();
  const st = (id: string, comune: string, lat: number, lon: number, price: number) => ({
    id, lat, lon, brand: `Marchio ${id}`, address: `Via ${id}`, comune, highway: false,
    prices: [{ fuel: 'Benzina', self: true, price, communicatedAt: recent }, { fuel: 'Gasolio', self: true, price: price - 0.1, communicatedAt: recent }],
  });
  const stations = [st('centro', 'VENEZIA', 45.448, 12.321, 2.414), st('mestre', 'VENEZIA', 45.49, 12.24, 1.984), st('lido', 'VENEZIA', 45.4199, 12.3753, 2.181)];
  const summary = Object.fromEntries(FUEL_KINDS.map((k) => [k, fuelSummary(stations, k, Date.now())]));
  await page.route('**/api/carburanti', (route) => route.fulfill({ json: { success: true, data: stations, summary, meta: { extractedAt: '2026-10-15' } } }));
  await page.goto('/metrics');
  const box = page.getByTestId('fuel-prices-metrics');
  await expect(box).toContainText('Il più economico');
  await expect(box).toContainText('1,984 €');
  await expect(box).toContainText('Marchio mestre · Via mestre, VENEZIA');
  await expect(box).toContainText('2,414 €');
  await expect(box).toContainText('su un pieno da 40 litri: 17,20 €');
  const zones = box.getByTestId('fuel-zones');
  await expect(zones.locator('tbody tr')).toHaveCount(5);
  await expect(zones.locator('tbody tr').filter({ hasText: 'Centro storico e isole' })).toContainText('2,414 €');
  await box.getByRole('button', { name: 'Gasolio' }).click();
  await expect(box).toContainText('1,884 €');
});

test('metrics: indicatori territoriali divisi per contesto, con sotto-schede e ricerca', async ({ page }) => {
  await page.goto('/metrics');
  // nella vista completa i quattro contesti compaiono in ordine, con il loro nome
  for (const g of ['society', 'mobility', 'services', 'city']) await expect(page.getByTestId(`metrics-group-${g}`)).toBeVisible();
  await expect(page.getByTestId('metrics-group-services')).toContainText('Servizi ed emergenze');
  await page.getByRole('button', { name: '1. Indicatori territoriali' }).click();
  const tabs = page.getByTestId('metrics-groups');
  await tabs.getByRole('button', { name: 'Mobilità' }).click();
  await expect(page.getByTestId('metrics-group-mobility')).toContainText('Trasporto pubblico adesso');
  await expect(page.getByTestId('metrics-group-services')).toHaveCount(0);
  await expect(page.getByTestId('metrics-group-city')).toHaveCount(0);
  await tabs.getByRole('button', { name: 'Servizi ed emergenze' }).click();
  await expect(page.getByTestId('fuel-prices-metrics')).toBeVisible();
  await tabs.getByRole('button', { name: 'Tutti' }).click();
  // la ricerca lascia solo i contesti che corrispondono
  await page.getByRole('searchbox').fill('carburanti');
  await expect(page.getByTestId('metrics-group-services')).toBeVisible();
  await expect(page.getByTestId('metrics-group-society')).toHaveCount(0);
});

test('metrics: curiosità su calli e ponti con link per verificarle e per arrivarci', async ({ page }) => {
  await page.goto('/metrics');
  const box = page.getByTestId('calli-curiosities');
  await expect(box).toContainText('Ponti pedonali');
  await expect(box.getByTestId('calli-narrowest').locator('li')).toHaveCount(5);
  await expect(box.getByTestId('calli-narrowest')).toContainText('Calle Varisco');
  await expect(box.getByTestId('calli-bridges')).toContainText('Ponte della Costituzione');
  const first = box.getByTestId('calli-longest').locator('li').first();
  await expect(first.getByRole('link', { name: 'OSM' })).toHaveAttribute('href', /openstreetmap\.org\/way\/\d+/);
  await first.getByRole('link', { name: 'come arrivare' }).click();
  await expect(page.locator('[data-info-panel]').getByTestId('planner-to')).toContainText('Calle', { timeout: 15000 });
});

test('trasporto pubblico: livello "velocità da orario" e sezione in /metrics', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pannello dei livelli controllato su desktop');
  await page.goto('/?layers=velocita_orario');
  await page.locator('canvas').waitFor();
  const panel = page.locator('aside').filter({ visible: true }).first();
  await panel.getByRole('searchbox', { name: /cerca tra i livelli/i }).fill('velocità richiesta');
  await expect(panel).toContainText('Più veloce dei limiti');
  await page.goto('/metrics');
  await expect(page.getByRole('heading', { name: 'Trasporto pubblico adesso' })).toBeVisible();
  const speed = page.getByTestId('schedule-speed');
  await expect(speed).toContainText('Con margine');
  await expect(speed).toContainText('non il comportamento di un singolo mezzo');
});

test('fermata del People Mover: partenze da orario nei prossimi 90 minuti', async ({ page, isMobile }) => {
  test.skip(isMobile, 'stesso comportamento, controllato su desktop');
  await page.goto('/');
  await page.locator('canvas').waitFor();
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder(/cerca fermate/i).fill('Marittima');
  await page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: /Fermata ACTV \(PM\)/ }).first().click();
  const section = page.locator('[data-info-panel]').getByTestId('scheduled-departures');
  await expect(section).toContainText('Partenze da orario');
  const hour = Number(new Date().toLocaleString('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }));
  // servizio dalle 7:10 (8:10 nei festivi) alle 22:50: nelle ore centrali ci sono sempre partenze ogni 10 minuti
  if (hour >= 9 && hour <= 21) {
    await expect(section.locator('li').first()).toContainText('PM');
    expect(await section.locator('li').count()).toBeGreaterThan(8);
  }
});

test('note legali: attribuzione OpenStreetMap sempre visibile e pagina privacy con licenze e richieste dei titolari', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor();
  const attribution = page.getByTestId('map-attribution');
  await expect(attribution).toContainText('© OpenStreetMap contributors');
  await expect(attribution.getByRole('link', { name: /fonti dei dati/i })).toHaveAttribute('href', '/sources');
  await page.goto('/privacy');
  for (const h of ['Progetto senza fini di lucro', 'Licenze e citazione delle fonti', 'Esclusione di responsabilità', 'Richieste dei titolari dei dati']) {
    await expect(page.getByRole('heading', { name: h })).toBeVisible();
  }
  await expect(page.getByTestId('privacy-contact').getByRole('link', { name: '@veniceopendata' })).toHaveAttribute('href', 'https://www.instagram.com/veniceopendata/');
});

test('metriche: residenti per sestiere dal censimento ISTAT, non più valori di esempio', async ({ page }) => {
  await page.goto('/metrics');
  const section = page.getByTestId('residents-census');
  await expect(section).toContainText('Residenti, famiglie e abitazioni');
  for (const s of ['Cannaregio', 'Castello', 'San Marco', 'Burano', 'Lido']) await expect(section).toContainText(s);
  // la Giudecca compare solo come parte di Dorsoduro, non come sestiere
  await expect(section).toContainText(/di cui: Giudecca/);
  await expect(section).toContainText('ISTAT');
  await expect(page.getByText('Pressione turistica per sestiere')).toHaveCount(0);
});

test('pagina /features: funzionalità per gruppo e link «Prova» che aprono lo strumento', async ({ page, isMobile }) => {
  await page.goto('/features');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Funzionalità di VOD');
  for (const id of ['planner', 'floodSim', 'civic', 'realtime', 'mcp']) await expect(page.getByTestId(`feature-${id}`)).toBeVisible();
  // «Come arrivare»: il link apre la mappa con il planner già aperto
  await page.getByTestId('feature-planner').getByRole('link', { name: /prova/i }).click();
  await expect(page).toHaveURL(/\/$|\/\?/);
  await expect(page.locator('[data-info-panel]')).toContainText('Come arrivare');
  await expect(page).not.toHaveURL(/open=/);
  // numeri civici: la ricerca si apre già compilata
  await page.goto('/features');
  await page.getByTestId('feature-civic').getByRole('link', { name: /prova/i }).click();
  await expect(page.getByPlaceholder(/civico/i)).toHaveValue('Cannaregio 3450');
  if (!isMobile) await expect(page.getByRole('dialog', { name: /ricerca/i }).getByRole('button').filter({ hasText: 'Cannaregio 3450' }).first()).toBeVisible();
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
  await expect(page.getByText('https://venice-open-data.vercel.app/api/mcp', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /scarica la skill/i })).toBeVisible();
});

test('llms.txt descrive il sito e il server MCP', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toContain('/api/mcp');
  expect(text).toContain('fiber_coverage');
});

test('pagina /privacy: nessun cookie, statistiche aggregate e link dal piè di pagina', async ({ page }) => {
  await page.goto('/features');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nessun cookie, nessun account' })).toBeVisible();
  await expect(page.getByText(/Vercel Web Analytics/)).toBeVisible();
  // il sito non imposta cookie
  expect(await page.context().cookies()).toHaveLength(0);
});

test('SEO: titolo, descrizione e canonico propri per ogni pagina, anteprima social e dati strutturati', async ({ request }) => {
  const pages = ['/', '/features', '/layers', '/metrics', '/sources', '/mcp', '/privacy'];
  const titles = new Set<string>();
  for (const path of pages) {
    const html = await (await request.get(path)).text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
    expect(title, path).toContain('VOD');
    titles.add(title);
    expect(new URL(canonical).pathname.replace(/\/$/, '') || '/', path).toBe(path);
    expect(description.length, path).toBeGreaterThan(80);
    expect(html, path).toMatch(/<meta property="og:image" content="[^"]+"/);
    expect(html, path).toContain('application/ld+json');
  }
  expect(titles.size).toBe(pages.length);
  const og = await request.get('/opengraph-image');
  expect(og.ok()).toBe(true);
  expect(og.headers()['content-type']).toContain('image/png');
  // catalogo dei dataset per Google Dataset Search
  const layers = await (await request.get('/layers')).text();
  const blocks = [...layers.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const catalog = blocks.find((b) => b['@type'] === 'DataCatalog');
  expect(catalog.dataset.length).toBeGreaterThan(20);
  expect(catalog.dataset[0]).toMatchObject({ '@type': 'Dataset', isAccessibleForFree: true });
});

test.describe('API', () => {
  test('ships restituisce navi AIS reali o dichiara che il feed non è configurato', async ({ request }) => {
    const body = await (await request.get('/api/ships')).json();
    expect(body.success).toBe(true);
    expect(['live', 'not-configured']).toContain(body.meta.kind);
    expect(Array.isArray(body.data)).toBe(true);
    for (const s of body.data) {
      expect(s.mmsi).toMatch(/^\d+$/);
      expect(s.lastSeen).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
    if (body.meta.kind === 'not-configured') expect(body.data).toEqual([]);
  });

  test('API REST dei dataset: catalogo, filtro geografico ed errori espliciti', async ({ request }) => {
    const cat = await (await request.get('/api/datasets')).json();
    expect(cat.datasets.length).toBeGreaterThan(20);
    expect(cat.relatedServices[0].endpoint).toContain('cruscotto-italia');
    const res = await request.get('/api/datasets/fiber_coverage?lat=45.438&lon=12.3358&radius=200&limit=3');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items[0].technology).toBe('FTTH');
    expect((await request.get('/api/datasets/nope')).status()).toBe(404);
    expect((await request.get('/api/datasets/tourism?lat=45.4&lon=12.3')).status()).toBe(400);
    expect((await request.get('/api/datasets/canals?foo=1')).status()).toBe(400);
    const profile = await (await request.get('/api/datasets/municipal_profile?text=Venezia')).json();
    expect(profile.items[0].kpi.anagrafica.istat).toBe('027042');
  });

  test('POST /mcp è un alias del server MCP, GET /mcp resta la pagina', async ({ request }) => {
    const res = await request.post('/mcp', {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' },
      data: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } } },
    });
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('vod-venice-open-data');
    const page = await request.get('/mcp');
    expect(page.headers()['content-type']).toContain('text/html');
  });

  test('la skill è scaricabile come ZIP', async ({ request }) => {
    const res = await request.get('/downloads/venice-open-data-skill.zip');
    expect(res.ok()).toBe(true);
    const bytes = await res.body();
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
  });

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
    expect(tools.tools.map((t: { name: string }) => t.name).sort()).toEqual(['airport_connections', 'find_place', 'flood_simulation', 'list_datasets', 'plan_trip', 'query_dataset', 'stop_departures']);
    // come arrivare: stesso motore della mappa, con fonti e link a VOD
    const trip = JSON.parse((await rpc(10, 'tools/call', { name: 'plan_trip', arguments: { from: 'Ferrovia', to: 'Murano Colonna', date: '2026-10-14', time: '10:00' } })).content[0].text);
    expect(trip.found).toBe(true);
    expect(trip.itineraries[0].legs.some((l: { type: string }) => l.type === 'mezzo')).toBe(true);
    expect(trip.sources.map((x: { name: string }) => x.name).join(' ')).toMatch(/ACTV/);
    expect(trip.vodUrl).toMatch(/open=planner/);
    const flood = JSON.parse((await rpc(11, 'tools/call', { name: 'flood_simulation', arguments: { levelCm: 130, place: 'Piazza San Marco' } })).content[0].text);
    expect(flood.floodedHistoricCentrePercent).toBeGreaterThan(60);
    expect(flood.place.wet).toBe(true);
    const list = await rpc(3, 'tools/call', { name: 'list_datasets', arguments: {} });
    expect(JSON.parse(list.content[0].text).datasets.length).toBeGreaterThan(20);
    // navi (aisstream) e voli (OpenSky): solo nella mappa, non ridistribuiti
    const ids = JSON.parse(list.content[0].text).datasets.map((d: { id: string }) => d.id);
    expect(ids).not.toContain('ships');
    expect(ids).not.toContain('flights');
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

  test('weather: temperatura del centro storico misurata o null, mai un valore di riserva', async ({ request }) => {
    const json = await (await request.get('/api/weather')).json();
    expect(json.data).toHaveProperty('cityTemp');
    const t = json.data.cityTemp;
    if (t) {
      expect(['1026', '1039', '1029']).toContain(t.stationId);
      expect(typeof t.celsius).toBe('number');
      expect(t.humidityPercent === null || (t.humidityPercent >= 0 && t.humidityPercent <= 100)).toBe(true);
      expect(t.observedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    }
  });

  test('limiti di velocità dagli atti ufficiali sui canali OSM, con atto e link', async ({ request }) => {
    const body = await (await request.get('/api/waterways')).json();
    const limits = body.data.speedLimits as { channelName: string; maxSpeedKmh: number; actvSpeedKmh: number | null; legalRef: string; sourceUrl: string }[];
    expect(limits.length).toBeGreaterThan(150);
    const cg = limits.find((l) => l.channelName === 'Canal Grande')!;
    expect([cg.maxSpeedKmh, cg.actvSpeedKmh]).toEqual([7, 11]);
    for (const l of limits) {
      expect(l.legalRef).toBeTruthy();
      expect(l.sourceUrl).toMatch(/^https:/);
      expect(l).not.toHaveProperty('isBarcavelox');
    }
  });

  test('fontanelle: Venice Tap Water come fonte primaria con stato e link, OSM senza doppioni nella vista unica', async ({ request }) => {
    const body = await (await request.get('/api/city-assets')).json();
    expect(body.veniceTapWaterMetadata.sourceUrl).toBe('https://www.venicetapwater.org');
    const vtw = body.fountains.filter((f: { source: string }) => f.source === 'VENICE_TAP_WATER');
    expect(vtw.length).toBeGreaterThanOrEqual(200);
    expect(vtw.every((f: { sourceUrl: string; status: string }) => f.sourceUrl === 'https://www.venicetapwater.org' && ['open', 'closed', 'unknown'].includes(f.status))).toBe(true);
    const assets = body.data.assets.filter((a: { type: string }) => a.type === 'FOUNTAIN');
    expect(assets.some((a: { duplicateOf?: string }) => a.duplicateOf)).toBe(false);
  });

  test('passerelle: i 72 percorsi del piano con la quota, senza uno stato di montaggio inventato', async ({ request }) => {
    const body = await (await request.get('/api/passerelle')).json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(72);
    expect(body.data).toHaveLength(72);
    expect(Math.round(body.totalMeters)).toBe(3715);
    for (const p of body.data) {
      expect(p).not.toHaveProperty('isMounted');
      expect(p.activationThresholdCm).toBeGreaterThanOrEqual(80);
    }
    expect(body.source).toContain('indicativi');
  });

  test('tide risponde con il contratto atteso anche se la fonte è giù', async ({ request }) => {
    const res = await request.get('/api/tide');
    const body = await res.json();
    expect([200, 503]).toContain(res.status());
    expect(body.data.moseGates).toHaveLength(4);
    expect(body.meta.levels.kind).toBe('live');
  });

  test('dati del Centro Maree: licenza CC BY-SA 3.0 sui dati redistribuiti, con le due fonti della licenza', async ({ request }) => {
    const tide = await (await request.get('/api/tide')).json();
    expect(tide.meta.levels.license).toBe('CC BY-SA 3.0');
    expect(tide.meta.levels.licenseSources).toContain('https://www.comune.venezia.it/it/content/open-data-0');
    const weather = await (await request.get('/api/weather')).json();
    expect(weather.meta.windStations.license).toBe('CC BY-SA 3.0');
  });

  test('flixbus: corse che toccano Venezia, con fermate veneziane e licenza ODbL', async ({ request }) => {
    const body = await (await request.get('/api/flixbus')).json();
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(20);
    expect(body.meta.license).toMatch(/ODbL/);
    for (const t of body.data.trips) {
      expect(t.stops.some((s: unknown[]) => s[4] === true)).toBe(true);
      expect(body.data.shapes[t.shape].length).toBeGreaterThan(1);
    }
  });

  test('avvisi ACTV: feed ufficiale, solo avvisi in corso, link ad ACTV', async ({ request }) => {
    const res = await request.get('/api/avvisi-actv');
    const body = await res.json();
    console.log('avvisi ACTV:', JSON.stringify({ ok: body.success, avvisi: body.data.length, conFermata: body.data.filter((n: { stops: unknown[] }) => n.stops.length).length }));
    test.skip(!body.success, 'feed ACTV non raggiungibile');
    for (const n of body.data) {
      expect(n.url).toMatch(/^https:\/\/(actv|avm)\.avmspa\.it\//);
      expect(n.title.length).toBeGreaterThan(3);
      for (const s of n.stops) expect(typeof s.lat).toBe('number');
    }
  });

  test('fermate bus: tutte quelle del GTFS nell\'area della mappa, con linee e codici', async ({ request }) => {
    const body = await (await request.get('/api/fermate-bus')).json();
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(500);
    for (const s of body.data) {
      expect(s.mode).toBe('bus');
      expect(s.gtfsIds.length).toBeGreaterThan(0);
      expect(s.lines.length).toBeGreaterThan(0);
    }
    const lido = body.data.filter((s: { name: string }) => /^Malamocco|^Alberoni|^Gran Viale/.test(s.name));
    expect(lido.length).toBeGreaterThan(3);
  });

  test('servizio adesso e velocità da orario: dati coerenti, nessuno storico', async ({ request }) => {
    const service = await (await request.get('/api/servizio')).json();
    console.log('servizio:', JSON.stringify({ ok: service.success, linee: service.count, inCoda: service.data.reduce((n: number, l: { bunched: unknown[] }) => n + l.bunched.length, 0) }));
    for (const l of service.data) {
      expect(l.gps).toBeGreaterThanOrEqual(0);
      if (l.withoutGps !== null) expect(l.withoutGps).toBe(Math.max(0, l.scheduled - l.gps));
      if (l.onTimeShare !== null) expect(l.onTimeShare).toBeGreaterThanOrEqual(0);
      for (const p of l.bunched) expect(p.gapS).toBeLessThan(p.headwayS);
    }
    const speed = await (await request.get('/api/velocita-orario')).json();
    expect(speed.success).toBe(true);
    expect(speed.count).toBeGreaterThan(100);
    expect(speed.meta.note).toMatch(/non misura/);
    for (const s of speed.data) {
      expect(['tooFast', 'tight', 'ok', 'partial']).toContain(s.verdict);
      if (s.verdict === 'tooFast') expect(s.scheduledS + 60).toBeLessThan(s.legalMinS * 0.9);
      expect(s.limitedM).toBeLessThanOrEqual(s.lengthM + 1);
    }
  });

  test('ordinanze: atti del Comune in vigore, con link ufficiale e senza terraferma', async ({ request }) => {
    const res = await request.get('/api/ordinanze');
    expect(res.status()).toBe(200);
    const body = await res.json();
    console.log('ordinanze:', JSON.stringify({ ok: body.success, atti: body.data.length, conPosizione: body.data.filter((o: { lat: number | null }) => o.lat !== null).length }));
    test.skip(!body.success, 'sito del Comune non raggiungibile');
    for (const o of body.data) {
      expect(['active', 'upcoming', 'unverified']).toContain(o.status);
      expect(o.url).toMatch(/^https:\/\/www\.comune\.venezia\.it\/it\/content\/ordinanza\?idPratica=/);
      expect(o.luogo).not.toMatch(/mestre|marghera|favaro|chirignago/i);
      if (o.lat !== null) expect(['comune', 'place', 'canal']).toContain(o.positionSource);
    }
  });

  test('parks: parchi e giardini OSM con perimetro, accesso dichiarato e niente luoghi privati', async ({ request }) => {
    const body = await (await request.get('/api/parks')).json();
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(400);
    expect(body.meta.attribution).toMatch(/OpenStreetMap/);
    const kinds = new Set(body.data.map((p: { kind: string }) => p.kind));
    for (const k of ['park', 'playground', 'garden']) expect(kinds.has(k)).toBe(true);
    for (const p of body.data) {
      expect(['public', 'customers', 'unknown']).toContain(p.access);
      for (const r of p.rings) expect(r[0]).toEqual(r[r.length - 1]);
    }
    expect(body.data.some((p: { name: string | null }) => p.name === 'Parco San Giuliano')).toBe(true);
  });

  test('mezzi in tempo reale: ritardo dalla posizione verificato con ACTV, mai valori incoerenti', async ({ request }) => {
    const body = await (await request.get('/api/realtime/vehicles')).json();
    console.log('ritardi:', JSON.stringify({ mezzi: body.count, conRitardo: body.meta.withDelay, daPosizione: body.meta.delayFromPosition, conflitti: body.meta.delayConflicts }));
    for (const v of body.data) {
      if (v.delayConflict) expect(v.delay).toBeNull();
      if (!v.delay) continue;
      expect(['position', 'actv']).toContain(v.delay.source);
      expect(Math.abs(v.delay.seconds)).toBeLessThanOrEqual(7200);
      if (v.delay.source === 'position' && v.delay.actvSeconds !== null) {
        expect(Math.abs(v.delay.seconds - v.delay.actvSeconds)).toBeLessThanOrEqual(900);
      }
    }
  });

  test('census: residenti ISTAT 2021 coerenti tra Comune, municipalità e sestieri', async ({ request }) => {
    const body = await (await request.get('/api/census')).json();
    expect(body.success).toBe(true);
    expect(body.meta.license).toBe('CC BY 4.0');
    const { city, municipalities, historicCentre, sestieri } = body.data;
    expect(municipalities.reduce((a: number, m: { population: number }) => a + m.population, 0)).toBe(city.population);
    expect(sestieri.reduce((a: number, s: { population: number }) => a + s.population, 0)).toBe(historicCentre.population);
    expect(sestieri).toHaveLength(6);
    expect(sestieri.map((s: { name: string }) => s.name)).not.toContain('Giudecca');
  });

  test('civici: esatto o il più vicino nello stesso sestiere, con errore esplicito se la ricerca non è un civico', async ({ request }) => {
    const ok = await (await request.get('/api/civici?q=' + encodeURIComponent('CN 3450'))).json();
    expect(ok.success).toBe(true);
    expect(ok.query.sestiere).toBe('Cannaregio');
    expect(['exact', 'nearest']).toContain(ok.result.match);
    expect(ok.result.sestiere).toBe('Cannaregio');
    expect(ok.meta.license).toMatch(/ODbL/);
    // un numero molto alto non esiste: risponde con il più vicino, dichiarato come approssimato
    const far = await (await request.get('/api/civici?q=Castello%2099999')).json();
    expect(far.result.match).toBe('nearest');
    expect((await request.get('/api/civici?q=Rialto')).status()).toBe(400);
  });

  test('aeroporto: partenze e arrivi dei prossimi 90 minuti, con le fonti', async ({ request }) => {
    const body = await (await request.get('/api/aeroporto')).json();
    expect(body.success).toBe(true);
    expect(body.windowMinutes).toBe(90);
    expect(Array.isArray(body.departures)).toBe(true);
    expect(Array.isArray(body.arrivals)).toBe(true);
    const now = Date.now();
    for (const r of [...body.departures, ...body.arrivals]) {
      expect(['bus', 'alilaguna', 'flixbus']).toContain(r.kind);
      expect(r.at).toBeGreaterThan(now - 5 * 60_000);
      expect(r.at).toBeLessThan(now + 100 * 60_000);
    }
    expect(body.meta.note).toMatch(/voli/);
    expect(body.meta.sources.length).toBe(3);
  });

  test('come arrivare lato server: itinerario con fonti, link a VOD ed errori espliciti', async ({ request }) => {
    const body = await (await request.get('/api/come-arrivare?da=Ferrovia&a=Murano%20Colonna&data=2026-10-14&ora=10:00')).json();
    expect(body.success).toBe(true);
    expect(body.found).toBe(true);
    expect(body.from.kind).toBe('stop');
    const it = body.itineraries[0];
    expect(it.depart).toMatch(/^\d{2}:\d{2}$/);
    expect(it.legs.some((l: { type: string; operator?: string }) => l.type === 'mezzo' && l.operator === 'ACTV')).toBe(true);
    expect(body.sources.some((x: { license: string }) => /ODbL/.test(x.license))).toBe(true);
    expect(body.vodUrl).toContain('open=planner');
    expect(body.vodUrl).toContain('ora=10%3A00');
    // indirizzi, civici e coordinate come luoghi
    const civic = await (await request.get('/api/come-arrivare?da=Cannaregio%203450&a=45.4341,12.3388&data=2026-10-14&ora=10:00&modo=a_piedi')).json();
    expect(civic.from.kind).toBe('civic');
    expect(civic.to.kind).toBe('coordinates');
    expect(civic.itineraries[0].vehicles).toBe(0);
    expect((await request.get('/api/come-arrivare?da=Ferrovia')).status()).toBe(400);
    expect((await request.get('/api/come-arrivare?da=Ferrovia&a=Xyzzzz%20Qwerty')).status()).toBe(404);
    expect((await request.get('/api/come-arrivare?da=Ferrovia&a=Rialto&ora=25:00')).status()).toBe(400);
  });

  test('come arrivare lato server: costo stimato per tipo di biglietto e opzione più economica', async ({ request }) => {
    const q = '/api/come-arrivare?da=Ferrovia&a=Murano%20Colonna&data=2026-10-14&ora=10:00';
    const ordinary = await (await request.get(q)).json();
    expect(ordinary.itineraries[0].cost).toMatchObject({ profile: 'biglietto ordinario', estimatedEur: 9.5 });
    expect(ordinary.sources.some((x: { url: string }) => /prezzi-vigore/.test(x.url))).toBe(true);
    const vu = await (await request.get(`${q}&tariffa=venezia_unica`)).json();
    expect(vu.itineraries[0].cost.estimatedEur).toBe(1.5);
    const pass = await (await request.get(`${q}&fare=pass`)).json();
    expect(pass.itineraries[0].cost.estimatedEur).toBe(0);
    expect((await request.get(`${q}&tariffa=gratis`)).status()).toBe(400);
    // barca privata: carburante dal consumo indicato (se il dato del Ministero risponde)
    const boat = await (await request.get('/api/come-arrivare?da=45.4318,12.3283&a=45.4274,12.3287&modo=barca&residente=1&data=2026-10-14&ora=14:00&consumo_lh=8')).json();
    expect(boat.fuel.estimatedLitres > 0 || /non disponibili/.test(boat.fuel.note)).toBe(true);
  });

  test('come arrivare in barca privata lato server: regole del Testo Unico e fonti degli atti', async ({ request }) => {
    const body = await (await request.get('/api/come-arrivare?da=45.4318,12.3283&a=45.4274,12.3287&modo=barca&residente=1&data=2026-10-14&ora=14:00')).json();
    expect(body.success).toBe(true);
    expect(body.found).toBe(true);
    expect(body.caveat).toMatch(/non valido per la navigazione/);
    expect(body.sources.map((x: { name: string }) => x.name).join(' ')).toMatch(/Testo Unico/);
  });

  test('partenze lato server: orario ACTV e Alilaguna, con la prossima corsa', async ({ request }) => {
    const rialto = await (await request.get('/api/partenze?fermata=Rialto&data=2026-10-14&ora=10:00')).json();
    expect(rialto.success).toBe(true);
    expect(rialto.departures.length).toBeGreaterThan(0);
    expect(rialto.departures[0].time).toMatch(/^\d{2}:\d{2}$/);
    const air = await (await request.get('/api/partenze?fermata=aeroporto&data=2026-10-14&ora=10:00')).json();
    expect(air.departures.some((d: { operator: string; line: string }) => d.operator === 'ACTV' && d.line === '5')).toBe(true);
    expect(air.departures.some((d: { operator: string }) => d.operator === 'Alilaguna')).toBe(true);
    expect(air.sources.map((x: { name: string }) => x.name).join(' ')).toMatch(/Alilaguna/);
    expect((await request.get('/api/partenze')).status()).toBe(400);
  });

  test('acqua alta lato server: città allagata, un luogo, percorso asciutto e link al simulatore', async ({ request }) => {
    const body = await (await request.get('/api/acqua-alta?marea=120&luogo=Piazza%20San%20Marco&da=Ferrovia&a=Rialto')).json();
    expect(body.success).toBe(true);
    expect(body.floodedHistoricCentrePercent).toBeCloseTo(35.5, 0);
    expect(body.sirenTones).toBe(2);
    expect(body.place.estimatedGroundCm).toBeLessThan(120);
    expect(body.walkingRoute.itinerary.legs.length).toBeGreaterThan(0);
    expect(body.vodUrl).toContain('marea=120');
    expect(body.caveat).toMatch(/Stima/);
    expect((await request.get('/api/acqua-alta?marea=999')).status()).toBe(400);
  });

  test('luoghi lato server: «marco polo» è l\'aeroporto', async ({ request }) => {
    const body = await (await request.get('/api/luoghi?q=marco%20polo')).json();
    expect(body.place.kind).toBe('airport');
  });

  test('indirizzi: calli e campi dal gazzettiere OSM, con la zona, senza servizi esterni', async ({ request }) => {
    const body = await (await request.get('/api/indirizzi?q=' + encodeURIComponent('cannaregio calle minestra'))).json();
    expect(body.success).toBe(true);
    expect(body.data[0].name).toBe('Calle Minestra');
    expect(typeof body.data[0].lon).toBe('number');
    expect(body.meta.license).toMatch(/ODbL/);
    expect((await request.get('/api/indirizzi?q=ca')).status()).toBe(400);
  });

  test('nautical: marine, carburante e ormeggi da OpenStreetMap', async ({ request }) => {
    const body = await (await request.get('/api/nautical')).json();
    const kinds = new Set(body.data.map((p: { kind: string }) => p.kind));
    for (const k of ['marina', 'fuel', 'slipway', 'mooring']) expect(kinds.has(k)).toBe(true);
    expect(body.meta.attribution).toMatch(/OpenStreetMap/);
    for (const p of body.data.filter((x: { kind: string }) => x.kind === 'mooring')) {
      expect([null, 'allowed', 'guest', 'private', 'commercial', 'permit', 'no']).toContain(p.access);
    }
  });

  test('sports unisce CAMPO e OpenStreetMap con fonti e licenze dichiarate', async ({ request }) => {
    const body = await (await request.get('/api/sports')).json();
    expect(body.data.length).toBeGreaterThan(100);
    const [campo, osm] = body.meta.sources;
    expect(campo.license).toMatch(/CC BY 4\.0/);
    expect(campo.licensePage).toMatch(/\/licenza$/);
    expect(osm.attribution).toMatch(/OpenStreetMap/);
    // CAMPO può essere temporaneamente irraggiungibile: allora restano solo gli impianti OSM
    expect(body.data.filter((p: { source: string }) => p.source === 'CAMPO').length).toBe(campo.count);
    for (const p of body.data.slice(0, 50)) expect(['CAMPO', 'OPENSTREETMAP']).toContain(p.source);
  });

  test('city-assets include i luoghi con Wi-Fi da OpenStreetMap, senza password', async ({ request }) => {
    const body = await (await request.get('/api/city-assets')).json();
    expect(body.wifiVenues.length).toBeGreaterThan(50);
    for (const w of body.wifiVenues) {
      expect(['free', 'customers', 'paid', 'unknown']).toContain(w.access);
      expect(w.source).toBe('OPENSTREETMAP');
    }
    expect(JSON.stringify(body.wifiVenues)).not.toMatch(/password/i);
  });

  test('carburanti: prezzi del Ministero o, se non raggiungibili, distributori OpenStreetMap senza prezzi', async ({ request }) => {
    const res = await request.get('/api/carburanti');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(30);
    for (const s of body.data as Array<Record<string, unknown>>) {
      for (const k of ['address', 'brand', 'comune', 'highway', 'id', 'lat', 'lon', 'prices']) expect(s).toHaveProperty(k);
      expect(JSON.stringify(s)).not.toMatch(/operator|gestore/i);
    }
    if (body.meta.pricesAvailable) {
      expect(body.meta.license).toMatch(/IODL 2\.0/);
      expect(body.meta.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    } else {
      expect(body.meta.license).toMatch(/ODbL/);
      expect(body.data.every((s: { prices: unknown[] }) => s.prices.length === 0)).toBe(true);
    }
  });

  test('lora-gateways: solo gateway online e nessun identificativo del proprietario', async ({ request }) => {
    const res = await request.get('/api/lora-gateways');
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.meta.source).toMatch(/Packet Broker/);
    for (const g of body.data as Array<Record<string, unknown>>) {
      expect(Object.keys(g).sort()).toEqual(['altitudeM', 'antennaCount', 'antennaPlacement', 'id', 'lat', 'lon', 'network', 'statusUpdatedAt']);
      expect(String(g.id)).toMatch(/^lora-\d+$/);
      expect(Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lon))).toBe(true);
    }
  });

  test('opere-bdap restituisce le opere in corso del Comune con fonte e riepilogo', async ({ request }) => {
    const res = await request.get('/api/opere-bdap');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.meta.license).toMatch(/CC BY/);
    expect(body.meta.source).toMatch(/Ragioneria Generale dello Stato/);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((p: { phase: string; cup: string }) => p.phase === 'execution' && p.cup.length === 15)).toBe(true);
    expect(body.summary.projects).toBeGreaterThan(body.summary.openProjects);
  });

  test('cantieri: le opere collegate per CUP hanno i dati del monitoraggio BDAP', async ({ request }) => {
    const body = await (await request.get('/api/cantieri')).json();
    const linked = body.data.filter((c: { bdap: unknown }) => c.bdap);
    expect(linked.length).toBe(body.meta.bdap.linked);
    expect(linked.length).toBeGreaterThan(0);
    for (const c of linked) expect(c.bdap.cup).toBe(c.cup);
  });

  test('MCP: dataset delle opere BDAP con riepilogo', async ({ request }) => {
    const res = await request.get('/api/datasets/public_works_bdap?limit=3');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('summary');
  });

  test('arrivi in tempo reale: validazione e formato', async ({ request }) => {
    expect((await request.get('/api/realtime/arrivals?lat=40&lon=12')).status()).toBe(400);
    const res = await request.get('/api/realtime/arrivals?lat=45.4378&lon=12.3358');
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.meta.source).toMatch(/TripUpdates/);
    for (const a of body.data) {
      expect(['early', 'onTime', 'late', 'veryLate']).toContain(a.status);
      expect(['constant', 'predicted']).toContain(a.estimate);
      expect(typeof a.time).toBe('number');
    }
  });

  test('mezzi in tempo reale: il ritardo, se presente, è recente e completo', async ({ request }) => {
    const body = await (await request.get('/api/realtime/vehicles')).json();
    const now = Date.now() / 1000;
    for (const v of body.data.filter((x: { delay: unknown }) => x.delay)) {
      expect(now - v.delay.updatedAt).toBeLessThan(180);
      expect(typeof v.delay.seconds).toBe('number');
    }
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

  test('il proxy del rate limit gira solo sulle route dinamiche', async ({ request }) => {
    const dynamicRes = await request.get('/api/stops');
    expect(dynamicRes.headers()['x-ratelimit-remaining']).toBeDefined();
    expect(dynamicRes.headers()['vercel-cdn-cache-control']).toContain('max-age=86400');
    const cachedRes = await request.get('/api/tide');
    expect(cachedRes.ok()).toBe(true);
    expect(cachedRes.headers()['x-ratelimit-remaining']).toBeUndefined();
  });
});
