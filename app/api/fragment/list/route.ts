import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { initData, itemId, price, unlist } = body;

    if (!itemId) {
      return NextResponse.json({ error: "itemId missing" }, { status: 400 });
    }
    if (!UUID_RE.test(String(itemId))) {
      return NextResponse.json(
        { error: `itemId не UUID: "${itemId}"` },
        { status: 400 }
      );
    }

    const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
    if (!tgUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: item, error: fetchErr } = await supabaseAdmin
      .from("nft_usernames")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: `fetch: ${fetchErr.message}` }, { status: 400 });
    }
    if (!item) {
      return NextResponse.json({ error: "Лот не найден" }, { status: 404 });
    }
    if (Number(item.owner_id) !== Number(tgUser.id)) {
      return NextResponse.json({ error: "Это не твой лот" }, { status: 403 });
    }

    if (unlist) {
      const { error } = await supabaseAdmin
        .from("nft_usernames")
        .update({ is_listed: false })
        .eq("id", itemId);
      if (error) {
        return NextResponse.json({ error: `unlist: ${error.message}` }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: `Некорректная цена: "${price}"` }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("nft_usernames")
      .update({ is_listed: true, price_ton: priceNum })
      .eq("id", itemId);

    if (error) {
      return NextResponse.json({ error: `update: ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: `catch: ${e?.message ?? String(e)}` },
      { status: 400 }
    );
  }
}
