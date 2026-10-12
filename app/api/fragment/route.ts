import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { initData, type, search } = await req.json();
  const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
  if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let query = supabaseAdmin
    .from("nft_usernames")
    .select("*")
    .eq("is_listed", true)
    .eq("type", type)
    .order("price_ton", { ascending: false })
    .limit(200);

  if (search) query = query.ilike("value", `%${search}%`);

  const { data } = await query;

  const { data: mine } = await supabaseAdmin
    .from("nft_usernames")
    .select("*")
    .eq("owner_id", tgUser.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ items: data ?? [], mine: mine ?? [] });
}
