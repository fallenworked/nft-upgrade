import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { initData } = await req.json();
  const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
  if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("user_gifts")
    .select("id, acquired_at, gift_catalog(*)")
    .eq("user_id", tgUser.id)
    .order("acquired_at", { ascending: false });

  const items = (data ?? []).map((r: any) => ({
    id: r.id,
    acquired_at: r.acquired_at,
    gift: r.gift_catalog,
  }));
  return NextResponse.json({ items });
}
