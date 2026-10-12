import { NextResponse } from "next/server";
import { validateInitData } from "@/lib/telegramAuth";
import { ensureUser, openCase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { initData, caseSlug } = await req.json();
    const tgUser = validateInitData(initData, process.env.BOT_TOKEN!);
    if (!tgUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await ensureUser(tgUser);
    const result = await openCase(caseSlug, tgUser.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "error" }, { status: 400 });
  }
}
