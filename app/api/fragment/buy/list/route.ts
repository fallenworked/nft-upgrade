import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { initData, itemId, price, unlist } = await req.json();
    const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
    if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: item } = await supabaseAdmin
      .from("nft_usernames").select("*").eq("id", itemId).single();
    if (!item) throw new Error("Лот не найден");
    if (item.owner_id !== tgUser.id) throw new Error("Это не твой лот");

    if (unlist) {
      await supabaseAdmin
        .from("nft_usernames")
        .update({ is_listed: false })
        .eq("id", itemId);
      return NextResponse.json({ ok: true });
    }

    if (!price || Number(price) <= 0) throw new Error("Некорректная цена");

    await supabaseAdmin
      .from("nft_usernames")
      .update({ is_listed: true, price_ton: Number(price) })
      .eq("id", itemId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "error" }, { status: 400 });
  }
}
