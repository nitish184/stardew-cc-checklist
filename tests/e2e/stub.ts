import type { Page, Request } from "@playwright/test";
import { bypassGate } from "./gate";

/**
 * Hermetic backend: every request that could touch the shared Supabase board is
 * intercepted and fulfilled locally. Nothing reaches the real project.
 *
 *  - Supabase REST selects (`*.supabase.co/rest/v1/...`) resolve to an empty
 *    board, so the UI renders with nothing checked.
 *  - Supabase auth/realtime endpoints are stubbed / closed.
 *  - Same-origin route handlers (`/api/check`, `/api/gift`, `/api/reset`,
 *    `/api/auth`, `/api/gift/reset`) return OK without running server code, so
 *    no toggle is ever forwarded to Supabase.
 *
 * Returns a recorder whose `apiCalls` / `supabaseCalls` arrays let tests assert
 * that a toggle hit the stub and never produced a real Supabase write.
 */
export async function stubBackend(page: Page) {
  const apiCalls: { url: string; method: string; body: string | null }[] = [];
  const supabaseCalls: { url: string; method: string }[] = [];

  // Seed the gate cookie so the checklist renders instead of <Gate/>.
  await bypassGate(page.context());

  // Supabase realtime is a websocket; close it so no live connection is made.
  await page.routeWebSocket(/supabase\.co/, (ws) => ws.close());

  // Supabase REST reads -> empty result set. Any write verb -> OK, but recorded
  // so a test can prove writes never travel this path from the browser.
  await page.route(/https?:\/\/[^/]*supabase\.co\/(rest|auth|realtime|storage)\//, (route) => {
    const req = route.request();
    supabaseCalls.push({ url: req.url(), method: req.method() });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: "[]",
    });
  });

  // Same-origin API route handlers -> OK, recorded, never execute server code.
  await page.route("**/api/**", (route) => {
    const req = route.request();
    apiCalls.push({ url: req.url(), method: req.method(), body: req.postData() });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  return {
    apiCalls,
    supabaseCalls,
    /** Real Supabase writes would use these verbs; the browser should never emit them. */
    supabaseWrites: () =>
      supabaseCalls.filter((c) => ["POST", "PATCH", "PUT", "DELETE"].includes(c.method)),
  };
}

/** True if a request would have hit the live Supabase host (i.e. escaped the stub). */
export const isSupabaseRequest = (req: Request) => req.url().includes("supabase.co");
