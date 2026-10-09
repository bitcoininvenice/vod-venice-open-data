import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;

/**
 * Test end-to-end sulla build di produzione (`npm run build` prima di eseguirli).
 * In locale si può usare il Chrome installato: PW_CHANNEL=chrome npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL || undefined,
    // L'app sceglie la lingua dal browser: i test usano le etichette italiane
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Tutti i test arrivano dallo stesso IP: il limite per IP (600/min in produzione) qui è più alto
    env: { API_RATE_LIMIT_PER_MINUTE: '20000' },
  },
});
