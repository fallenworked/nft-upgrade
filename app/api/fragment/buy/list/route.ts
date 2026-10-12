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

    if (!itemId) throw new Error("itemId не передан");

    const { data: item, error: fetchErr } = await supabaseAdmin
      .from("nft_usernames")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (fetchErr) throw new Error(`fetch: ${fetchErr.message}`);
    if (!item) throw new Error("Лот не найден");
    if (Number(item.owner_id) !== Number(tgUser.id))
      throw new Error("Это не твой лот");

    if (unlist) {
      const { error } = await supabaseAdmin
        .from("nft_usernames")
        .update({ is_listed: false })
        .eq("id", itemId);
      if (error) throw new Error(`unlist: ${error.message}`);
      return NextResponse.json({ ok: true });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      throw new Error("Некорректная цена");

    const { error } = await supabaseAdmin
      .from("nft_usernames")
      .update({
        is_listed: true,
        price_ton: priceNum,
      })
      .eq("id", itemId);

    if (error) throw new Error(`update: ${error.message}`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "error" },
      { status: 400 }
    );
  }
}
