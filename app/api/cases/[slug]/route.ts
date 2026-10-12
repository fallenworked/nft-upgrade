import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { data: caseRow } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("slug", params.slug)
    .single();
  if (!caseRow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: drops } = await supabaseAdmin
    .from("case_drops")
    .select("weight, gift_catalog(*)")
    .eq("case_id", caseRow.id);

  const total = (drops ?? []).reduce((s: number, d: any) => s + d.weight, 0);
  const items = (drops ?? []).map((d: any) => ({
    gift: d.gift_catalog,
    weight: d.weight,
    chance: total > 0 ? (d.weight / total) * 100 : 0,
  }));
  items.sort((a, b) => b.gift.base_price_ton - a.gift.base_price_ton);

  return NextResponse.json({ case: caseRow, items });
}
