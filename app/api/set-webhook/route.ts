import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (key !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN!;
  const APP_URL = process.env.WEBAPP_URL!;
  const SECRET = process.env.WEBHOOK_SECRET!;

  const webhookUrl = `${APP_URL}/api/telegram`;

  // ⬇️ ДИАГНОСТИКА — покажет, что реально уходит в Telegram
  return NextResponse.json({
    debug: {
      APP_URL,
      APP_URL_length: APP_URL.length,
      webhookUrl,
      webhookUrl_length: webhookUrl.length,
      has_space: /\s/.test(APP_URL),
      has_angle: /[<>]/.test(APP_URL),
      starts_https: APP_URL.startsWith("https://"),
      token_prefix: BOT_TOKEN.slice(0, 12) + "...",
    },
  });
}
