import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { ensureUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { initData } = await req.json();
  const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
  if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await ensureUser(tgUser);
  return NextResponse.json({ user });
}
