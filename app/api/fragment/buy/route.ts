import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { initData, itemId } = await req.json();
    const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
    if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: item } = await supabaseAdmin
      .from("nft_usernames").select("*").eq("id", itemId).single();
    if (!item) throw new Error("Лот не найден");
    if (!item.is_listed) throw new Error("Лот не выставлен");
    if (item.owner_id === tgUser.id) throw new Error("Это уже твой лот");

    const { data: user } = await supabaseAdmin
      .from("users").select("*").eq("id", tgUser.id).single();
    if (!user) throw new Error("Юзер не найден");
    if (Number(user.balance_ton) < Number(item.price_ton))
      throw new Error("Недостаточно TON");

    const newBalance = Number(user.balance_ton) - Number(item.price_ton);
    await supabaseAdmin
      .from("users").update({ balance_ton: newBalance }).eq("id", tgUser.id);

    if (item.owner_id) {
      const { data: seller } = await supabaseAdmin
        .from("users").select("balance_ton").eq("id", item.owner_id).single();
      if (seller) {
        await supabaseAdmin
          .from("users")
          .update({ balance_ton: Number(seller.balance_ton) + Number(item.price_ton) })
          .eq("id", item.owner_id);
      }
    }

    await supabaseAdmin
      .from("nft_usernames")
      .update({ owner_id: tgUser.id, is_listed: false, price_ton: 0 })
      .eq("id", itemId);

    return NextResponse.json({ ok: true, newBalance });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "error" }, { status: 400 });
  }
}
