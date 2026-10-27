import { defineConfig, devices } from "@playwright/test";

/**
 * Landing e2e. Run `make up` first: Django comes from Docker on 127.0.0.1:8010
 * (not 8000, often taken by another project that reuseExistingServer would pick up).
 * Next runs as a production build on port 3100 (and 3101 for the api-down project).
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
  // Les tests tagués @api-down ne tournent que dans le projet « api-down » (serveur Next sans API joignable).
  projects: [
    {
      name: "desktop",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      grepInvert: /@api-down/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      // Tablette portrait : disposition « mobile » des autocollants (zones réservées, 5 autocollants).
      name: "tablet",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
    },
    {
      name: "wide",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "laptop",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      // Positions « compact » des autocollants (1024 à 1279px).
      name: "laptop-sm",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
    {
      // API Django injoignable : build et serveur à part (port 3101, distDir .next-api-down), API_INTERNAL_URL
      // pointée sur un port fermé. Le build doit lui aussi voir l'API arrêtée : la page est prérendue (ISR).
      name: "api-down",
      grep: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: "http://127.0.0.1:3101" },
    },
  ],
  webServer: [
    {
      command: "docker compose up backend",
      cwd: "..",
      url: "http://127.0.0.1:8010/api/health/",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm build && pnpm start -p 3100",
      url: "http://127.0.0.1:3100",
      env: { API_INTERNAL_URL: "http://127.0.0.1:8010" },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      command: "pnpm build && pnpm start -p 3101",
      url: "http://127.0.0.1:3101",
      env: { API_INTERNAL_URL: "http://127.0.0.1:9", NEXT_DIST_DIR: ".next-api-down" },
      reuseExistingServer: !process.env.CI,
      timeout: 360_000,
    },
  ],
});
