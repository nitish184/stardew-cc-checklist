import { NextResponse } from "next/server";
import { isGated } from "@/lib/gate";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BOARD_ID } from "@/lib/gifts";

export async function POST(req: Request) {
  if (!(await isGated())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.givenBy === "string" ? body.givenBy.trim() : "";
  if (!body || typeof body.villagerId !== "string" || typeof body.given !== "boolean" || !name) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = body.given
    ? await admin
        .from("gifts")
        .upsert({ board_id: BOARD_ID, villager_id: body.villagerId, given_by: name })
    : await admin
        .from("gifts")
        .delete()
        .eq("board_id", BOARD_ID)
        .eq("villager_id", body.villagerId)
        .eq("given_by", name);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
