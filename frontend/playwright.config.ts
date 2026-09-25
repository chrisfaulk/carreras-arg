import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  webServer: {
    command: "pnpm start --port 3100",
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  use: { baseURL: "http://localhost:3100" },
});
