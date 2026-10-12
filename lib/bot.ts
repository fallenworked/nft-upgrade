import { Bot, InlineKeyboard, webhookCallback } from "grammy";

const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHANNEL_ID = process.env.CHANNEL_ID!;
const CHANNEL_URL = process.env.CHANNEL_INVITE_URL!;
const WEBAPP_URL = process.env.WEBAPP_URL!;

export const bot = new Bot(BOT_TOKEN);

async function isSubscribed(userId: number): Promise<boolean> {
  try {
    const m = await bot.api.getChatMember(CHANNEL_ID, userId);
    return ["member", "administrator", "creator"].includes(m.status);
  } catch {
    return false;
  }
}

bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;
  const ok = await isSubscribed(userId);

  if (ok) {
    return ctx.reply(
      "Добро пожаловать в NFT Upgrade 🎁\n\nВыбивай подарки, апгрейди их и собирай коллекцию.",
      {
        reply_markup: new InlineKeyboard().webApp(
          "🎮 Открыть NFT Upgrade",
          WEBAPP_URL
        ),
      }
    );
  }

  await ctx.reply(
    "🔒 Для доступа подпишись на наш канал:",
    {
      reply_markup: new InlineKeyboard()
        .url("📢 Подписаться", CHANNEL_URL)
        .row()
        .text("✅ Я подписался", "check_sub"),
    }
  );
});

bot.callbackQuery("check_sub", async (ctx) => {
  const userId = ctx.from.id;
  const ok = await isSubscribed(userId);

  if (!ok) {
    return ctx.answerCallbackQuery({
      text: "Ты ещё не подписался 😢",
      show_alert: true,
    });
  }

  await ctx.answerCallbackQuery({ text: "Подписка подтверждена ✅" });
  await ctx.editMessageText(
    "🎉 Отлично! Теперь у тебя есть доступ:",
    {
      reply_markup: new InlineKeyboard().webApp(
        "🎮 Открыть NFT Upgrade",
        WEBAPP_URL
      ),
    }
  );
});

// Экспорт для Next.js API route
export const handleWebhook = webhookCallback(bot, "std/http");
