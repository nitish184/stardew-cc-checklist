import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATE_COOKIE, expectedToken, gateToken } from "@/lib/gate";

export async function POST(req: Request) {
  const expected = expectedToken();
  if (!expected) return NextResponse.json({ ok: false }, { status: 503 });

  const { passphrase } = await req.json().catch(() => ({ passphrase: null }));
  if (typeof passphrase !== "string" || gateToken(passphrase) !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const store = await cookies();
  store.set(GATE_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return NextResponse.json({ ok: true });
}
