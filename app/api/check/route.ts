import { NextResponse } from "next/server";
import { isGated } from "@/lib/gate";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BOARD_ID } from "@/lib/board";

export async function POST(req: Request) {
  if (!(await isGated())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.slotId !== "string" || typeof body.checked !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (body.checked) {
    const name = typeof body.checkedBy === "string" ? body.checkedBy.trim() : "";
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await admin
      .from("checks")
      .upsert({ board_id: BOARD_ID, slot_id: body.slotId, checked_by: name });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("checks")
      .delete()
      .eq("board_id", BOARD_ID)
      .eq("slot_id", body.slotId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
