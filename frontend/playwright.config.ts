import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de la landing.
 *
 * Prérequis : la base Postgres du projet doit tourner avant `pnpm exec playwright test` :
 *   docker compose -f ../docker-compose.yml up -d db
 *   (cd ../backend && uv run python manage.py migrate)
 *
 * Deux serveurs sont lancés (ou réutilisés s'ils répondent déjà) :
 *   1. Django sur 127.0.0.1:8000 (compteurs publics de la landing) ;
 *   2. Next en build de production sur le port 3100, qui lit l'API via API_INTERNAL_URL.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: [
    {
      command: "uv run python manage.py runserver 127.0.0.1:8000",
      cwd: "../backend",
      url: "http://127.0.0.1:8000/api/health/",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm build && pnpm start -p 3100",
      url: "http://127.0.0.1:3100",
      env: { API_INTERNAL_URL: "http://127.0.0.1:8000" },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
