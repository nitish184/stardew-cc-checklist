import "server-only";

import { createHash } from "crypto";
import { cookies } from "next/headers";

export const GATE_COOKIE = "cc_gate";

/** Opaque token stored in the httpOnly cookie — forging it requires the passphrase. */
export function gateToken(passphrase: string): string {
  return createHash("sha256").update(passphrase).digest("hex");
}

export function expectedToken(): string | null {
  const pass = process.env.BOARD_PASSPHRASE;
  return pass ? gateToken(pass) : null;
}

export async function isGated(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const store = await cookies();
  return store.get(GATE_COOKIE)?.value === expected;
}
