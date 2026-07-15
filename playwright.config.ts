import { defineConfig, devices } from "@playwright/test";
import { GATE_PASSPHRASE } from "./tests/e2e/gate";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    // Pin the gate passphrase to a known test value (real process env wins over
    // .env.local in Next.js). Empirically an empty string is treated as "unset"
    // by `next dev` and falls back to .env.local, so tests instead inject the
    // matching gate cookie (see tests/e2e/gate.ts) to render the checklist —
    // without ever knowing or touching the production passphrase.
    // Dummy Supabase config so the browser client constructs without throwing
    // (CI has no .env.local). All Supabase traffic is stubbed in tests/e2e/stub.ts,
    // so these values are never actually used — they just keep createClient happy
    // and make local runs hermetic (real process env wins over .env.local).
    env: {
      BOARD_PASSPHRASE: GATE_PASSPHRASE,
      NEXT_PUBLIC_SUPABASE_URL: "https://stub.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "stub-anon-key",
    },
  },
});
