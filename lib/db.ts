import { supabaseAdmin } from "./supabase";

export function randomPhone() {
  const a = 900 + Math.floor(Math.random() * 100);
  const b = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const c = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  const d = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `+7 (${a}) ${b}-${c}-${d}`;
}

export async function ensureUser(tgUser: any) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", tgUser.id)
    .maybeSingle();
  if (existing) return existing;

  const { data: created } = await supabaseAdmin
    .from("users")
    .insert({
      id: tgUser.id,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      avatar_url: tgUser.photo_url ?? null,
      phone_number: randomPhone(),
      balance_ton: 100,
    })
    .select("*")
    .single();
  return created;
}

export async function listCases() {
  const { data } = await supabaseAdmin
    .from("cases")
    .select("*")
    .order("price_ton", { ascending: true });
  return data ?? [];
}

export async function openCase(caseSlug: string, userId: number) {
  const { data: caseRow } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("slug", caseSlug)
    .single();
  if (!caseRow) throw new Error("Кейс не найден");

  const { data: drops } = await supabaseAdmin
    .from("case_drops")
    .select("weight, gift_catalog(*)")
    .eq("case_id", caseRow.id);
  if (!drops || drops.length === 0) throw new Error("Нет дропов");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (!user) throw new Error("Юзер не найден");

  if (Number(user.balance_ton) < Number(caseRow.price_ton)) {
    throw new Error("Недостаточно TON");
  }

  const totalWeight = drops.reduce((s: number, d: any) => s + d.weight, 0);
  let r = Math.random() * totalWeight;
  let picked: any = drops[drops.length - 1];
  for (const d of drops as any[]) {
    r -= d.weight;
    if (r <= 0) {
      picked = d;
      break;
    }
  }
  const gift = picked.gift_catalog;

  const newBalance = Number(user.balance_ton) - Number(caseRow.price_ton);
  await supabaseAdmin
    .from("users")
    .update({ balance_ton: newBalance })
    .eq("id", userId);
  await supabaseAdmin
    .from("user_gifts")
    .insert({ user_id: userId, gift_id: gift.id });

  // все подарки из этого кейса — для ленты рулетки
  const allGifts = (drops as any[]).map((d) => d.gift_catalog);

  return { gift, newBalance, allGifts };
}
