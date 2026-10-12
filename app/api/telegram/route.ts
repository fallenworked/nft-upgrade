import { handleWebhook } from "@/lib/bot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Проверка секрета (Telegram присылает его в заголовке)
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  return handleWebhook(req);
}

export async function GET() {
  return Response.json({ ok: true });
}
