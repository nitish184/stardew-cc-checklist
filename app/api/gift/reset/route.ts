import { NextResponse } from "next/server";
import { isGated } from "@/lib/gate";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BOARD_ID } from "@/lib/gifts";

export async function POST() {
  if (!(await isGated())) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("gifts").delete().eq("board_id", BOARD_ID);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
