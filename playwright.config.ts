import {defineConfig} from '@playwright/test';

// Tests de extremo a extremo en pantallas de móvil contra el servidor de producción
// (build + un solo proceso). Por defecto usan el Edge del sistema; PW_CHANNEL lo cambia.
const PORT = 3200;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? 'msedge',
    locale: 'es-ES',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iphone-se', use: { viewport: { width: 375, height: 667 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run build && node dist/main.js',
    url: `http://localhost:${PORT}/health`,
    env: { PORT: String(PORT), ADMIN_TOKEN: 'e2e-admin-token' },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
