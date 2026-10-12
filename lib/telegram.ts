"use client";

import type { WebApp } from "@/types/telegram";

export function getTg(): WebApp | null {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getTg();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.("#0f0f0f");
  tg.setBackgroundColor?.("#0f0f0f");
  return tg;
}
