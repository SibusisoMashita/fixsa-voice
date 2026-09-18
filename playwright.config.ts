import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-360", use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 }, hasTouch: true } }
  ]
});
