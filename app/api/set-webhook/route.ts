import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  // простой пароль, чтобы чужой не дёргал
  if (key !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN!;
  const APP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL!;
  const SECRET = process.env.WEBHOOK_SECRET!;

  const webhookUrl = `${APP_URL}/api/telegram`;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: SECRET,
        drop_pending_updates: true,
      }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
