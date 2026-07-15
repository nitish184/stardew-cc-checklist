import { createHash } from "node:crypto";
import type { BrowserContext } from "@playwright/test";

/**
 * A throwaway passphrase pinned into the dev server's env (see playwright.config).
 * Tests never learn the real production passphrase — they mint the gate cookie
 * from this known test value instead.
 */
export const GATE_PASSPHRASE = "playwright-e2e-passphrase";

const GATE_COOKIE = "cc_gate";

/** Mirrors lib/gate.ts gateToken(): sha256(passphrase) hex. */
const gateToken = (pass: string) => createHash("sha256").update(pass).digest("hex");

/** Seed the gate cookie so app/page.tsx server-renders the checklist, not <Gate/>. */
export async function bypassGate(context: BrowserContext) {
  await context.addCookies([
    {
      name: GATE_COOKIE,
      value: gateToken(GATE_PASSPHRASE),
      url: "http://localhost:3000",
    },
  ]);
}
