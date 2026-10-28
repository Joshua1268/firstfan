import { defineConfig, devices } from "@playwright/test";

// Django comes from Docker on 8010 (run make up first); Next runs as a production build on 3100 and 3101.
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
  // Tests tagged @api-down only run in the api-down project, against a Next server with no reachable API.
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
      // Portrait tablet: stickers use the mobile layout.
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
      // Compact sticker positions (1024 to 1279px).
      name: "laptop-sm",
      grepInvert: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
    {
      // Separate build pointed at a closed port: the home page is prerendered, so the build must see the API down too.
      name: "api-down",
      grep: /@api-down/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, baseURL: "http://127.0.0.1:3101" },
    },
  ],
  webServer: [
    {
      // Django comes from Docker only: fail fast instead of starting it here.
      command: "echo 'Django is not running on 8010: run make up first.' && exit 1",
      url: "http://127.0.0.1:8010/api/health/",
      reuseExistingServer: true,
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
