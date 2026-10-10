import { expect, test } from '@playwright/test';
import { SIM_URL } from '../src/lib/simulation-data';

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
  if (isMobile) await page.getByRole('button', { name: /filtri/i }).click();
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
  await panel.getByRole('button', { name: /attiva i livelli verificati di mobilità/i }).click();
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
  // la linea 2 è rossa (#FF0000 nel GTFS di ACTV)
  const line2 = info.getByText(/^Linea 2$/).first();
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

  test('tide risponde con il contratto atteso anche se la fonte è giù', async ({ request }) => {
    const res = await request.get('/api/tide');
    const body = await res.json();
    expect([200, 503]).toContain(res.status());
    expect(body.data.moseGates).toHaveLength(4);
    expect(body.meta.levels.kind).toBe('live');
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
