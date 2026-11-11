import { defineConfig, devices } from "@playwright/test";

// Projects match the ISA Test Strategy: mobile-360, mobile-375, mobile-390, desktop.
// webServer builds and starts the app for every run, so no test starts a server by hand.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

const mobile = (width: number, height: number) => ({
  ...devices["Pixel 7"],
  viewport: { width, height },
});

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "mobile-360", use: mobile(360, 780) },
    { name: "mobile-375", use: mobile(375, 812) },
    { name: "mobile-390", use: mobile(390, 844) },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start --port ${PORT}`,
        // Throwaway values: e2e never uses real Ravelry credentials or .env.local
        // (process env takes precedence over .env files in Next.js).
        env: {
          APP_URL: BASE_URL,
          RAVELRY_CLIENT_ID: "e2e-client-id",
          RAVELRY_CLIENT_SECRET: "e2e-client-secret",
          RAVELRY_READONLY_USERNAME: "e2e-readonly",
          RAVELRY_READONLY_PASSWORD: "e2e-readonly-pass",
          SESSION_SECRET: "e2e-session-secret-0123456789abcdef0123456789",
          BETA_ALLOWLIST: "e2e-user",
        },
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
