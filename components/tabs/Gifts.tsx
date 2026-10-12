"use client";

import { useEffect, useState, useCallback } from "react";
import { getTg } from "@/lib/telegram";

type Case = { id: string; slug: string; name: string; price_ton: number; is_free: boolean };
type Gift = { id: string; name: string; rarity: string; image_url: string; base_price_ton: number };
type CaseItem = { gift: Gift; weight: number; chance: number };
type InventoryItem = { id: string; acquired_at: string; gift: Gift };
type User = { id: number; balance_ton: number; avatar_url: string | null; first_name: string | null };

const RARITY: Record<string, { color: string; label: string }> = {
  common:    { color: "#6B7280", label: "Common" },
  rare:      { color: "#3B82F6", label: "Rare" },
  epic:      { color: "#A855F7", label: "Epic" },
  legendary: { color: "#F59E0B", label: "Legendary" },
  mythic:    { color: "#EF4444", label: "Mythic" },
};

const CARD_W = 100;
const REEL_SIZE = 50;
const WINNER_INDEX = 45;

export default function Gifts() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // превью кейса
  const [preview, setPreview] = useState<Case | null>(null);
  const [previewItems, setPreviewItems] = useState<CaseItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // рулетка
  const [reel, setReel] = useState<Gift[]>([]);
  const [translate, setTranslate] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Gift | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const tg = typeof window !== "undefined" ? getTg() : null;

  const loadInventory = useCallback(async () => {
    if (!tg?.initData) return;
    const r = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    });
    const d = await r.json();
    if (d.items) setInventory(d.items);
  }, [tg?.initData]);

  useEffect(() => {
    const t = getTg();
    if (!t?.initData) { setLoading(false); return; }
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: t.initData }),
          }),
          fetch("/api/cases"),
        ]);
        const d1 = await r1.json();
        const d2 = await r2.json();
        if (d1.user) setUser(d1.user);
        if (d2.cases) setCases(d2.cases);
        await loadInventory();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadInventory]);

  async function openPreview(c: Case) {
    setPreview(c);
    setPreviewItems([]);
    setPreviewLoading(true);
    try {
      const r = await fetch(`/api/cases/${c.slug}`);
      const d = await r.json();
      if (d.items) setPreviewItems(d.items);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function spin(c: Case) {
    const t = getTg();
    if (!t?.initData) return;
    setSpinning(true);
    setResult(null);
    setAnimate(false);
    setTranslate(0);

    try {
      const r = await fetch("/api/cases/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: t.initData, caseSlug: c.slug }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      const winner: Gift = d.gift;
      const pool: Gift[] = d.allGifts ?? [winner];
      const fill: Gift[] = Array.from({ length: REEL_SIZE }, (_, i) =>
        i === WINNER_INDEX ? winner : pool[Math.floor(Math.random() * pool.length)]
      );
      setReel(fill);

      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimate(true);
          setTranslate(-(WINNER_INDEX * CARD_W) + 40);
        }, 30);
      });

      setTimeout(async () => {
        setSpinning(false);
        setResult(winner);
        setUser((u) => u ? { ...u, balance_ton: Number(d.newBalance) } : u);
        await loadInventory();
      }, 4300);
    } catch (e: any) {
      setToast(e.message ?? "Ошибка");
      setTimeout(() => setToast(null), 2500);
      setSpinning(false);
    }
  }

  function closeAll() {
    if (spinning) return;
    setPreview(null);
    setPreviewItems([]);
    setReel([]);
    setResult(null);
    setAnimate(false);
    setTranslate(0);
  }

  if (loading) return <div className="p-4 text-white/50">Загрузка…</div>;

  // unique inventory for display (dedupe by gift id, count)
  const invMap = new Map<string, { gift: Gift; count: number }>();
  for (const item of inventory) {
    const k = item.gift.id;
    const prev = invMap.get(k);
    if (prev) prev.count += 1;
    else invMap.set(k, { gift: item.gift, count: 1 });
  }
  const invList = Array.from(invMap.values());

  return (
    <div className="p-4 pb-28">
      {/* Хедер */}
      <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#1c1c1e] p-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-white/10">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : <div className="flex h-full w-full items-center justify-center">👤</div>}
          </div>
          <div>
            <div className="text-[11px] text-white/50">Ваш баланс</div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">💎</span>
              <span className="text-lg font-bold text-white">
                {Number(user?.balance_ton ?? 0).toFixed(2)}
              </span>
              <span className="text-xs text-white/40">TON</span>
            </div>
          </div>
        </div>
        <button className="rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white">
          Пополнить
        </button>
      </div>

      {/* Заголовок */}
      <h1 className="mb-3 text-2xl font-bold text-white">Gifts 🎁</h1>

      {/* Сетка кейсов */}
      <div className="grid grid-cols-2 gap-3">
        {cases.map((c) => {
          const accent = c.is_free ? "#F59E0B" : c.slug === "premium" ? "#EF4444" : "#8B5CF6";
          return (
            <button
              key={c.id}
              onClick={() => openPreview(c)}
              className="group overflow-hidden rounded-2xl bg-[#1c1c1e] text-left transition active:scale-95"
              style={{ border: `1px solid ${accent}40` }}
            >
              <div
                className="flex h-32 items-center justify-center text-6xl"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${accent}40 0%, #151517 70%)`,
                }}
              >
                🎁
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[11px] text-white/40">
                    {c.is_free ? "Каждые 24ч" : "Открыть"}
                  </div>
                  <div
                    className="rounded-lg px-2 py-1 text-xs font-bold"
                    style={{ background: `${accent}25`, color: accent }}
                  >
                    {c.is_free ? "FREE" : `${c.price_ton} TON`}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Инвентарь */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-white">
          Мой инвентарь <span className="text-white/40">· {inventory.length}</span>
        </h2>
        {invList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
            Пока пусто. Открой первый кейс!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {invList.map(({ gift, count }) => (
              <div
                key={gift.id}
                className="overflow-hidden rounded-xl bg-[#1c1c1e]"
                style={{ border: `1px solid ${RARITY[gift.rarity]?.color ?? "#333"}50` }}
              >
                <div className="relative flex h-20 items-center justify-center bg-[#0f0f10] p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gift.image_url} alt={gift.name} className="h-full w-full object-contain" />
                  {count > 1 && (
                    <div className="absolute right-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      x{count}
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1">
                  <div className="truncate text-[10px] text-white/70">{gift.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==== МОДАЛКА ПРЕВЬЮ КЕЙСА ==== */}
      {preview && !reel.length && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between p-4">
            <button onClick={closeAll} className="text-2xl text-white/60">✕</button>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{preview.name}</div>
              <div className="text-[11px] text-white/40">
                {preview.is_free ? "Бесплатный" : `${preview.price_ton} TON`}
              </div>
            </div>
            <div className="w-6" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="mb-3 text-xs text-white/50">Возможные подарки:</div>
            {previewLoading ? (
              <div className="py-10 text-center text-white/40">Загрузка…</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {previewItems.map((it, i) => {
                  const r = RARITY[it.gift.rarity] ?? RARITY.common;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl bg-[#1c1c1e] p-2"
                      style={{ border: `1px solid ${r.color}40` }}
                    >
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-[#0f0f10] p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.gift.image_url}
                          alt={it.gift.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">
                          {it.gift.name}
                        </div>
                        <div
                          className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ background: `${r.color}25`, color: r.color }}
                        >
                          {r.label}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/50">
                          {it.chance.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-4">
            <button
              onClick={() => spin(preview)}
              disabled={Number(user?.balance_ton ?? 0) < Number(preview.price_ton)}
              className="w-full rounded-2xl bg-[#8B5CF6] py-4 text-lg font-bold text-white disabled:opacity-40"
            >
              {preview.is_free ? "Открыть бесплатно" : `Открыть за ${preview.price_ton} TON`}
            </button>
          </div>
        </div>
      )}

      {/* ==== МОДАЛКА РУЛЕТКИ ==== */}
      {reel.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4">
          {!result && (
            <>
              <div className="mb-6 text-center">
                <div className="text-xs text-white/50">Открываем</div>
                <div className="text-xl font-bold text-white">{preview?.name}</div>
              </div>
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1c1c1e] py-6">
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-0.5 -translate-x-1/2 bg-[#A78BFA]" />
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-lg bg-[#A78BFA] px-2 py-1 text-[10px] font-bold text-black">
                  ▼
                </div>
                <div
                  className="flex gap-2"
                  style={{
                    transform: `translateX(${translate}px)`,
                    transition: animate ? "transform 4s cubic-bezier(0.15,0.9,0.15,1)" : "none",
                  }}
                >
                  {reel.map((g, i) => {
                    const r = RARITY[g.rarity] ?? RARITY.common;
                    return (
                      <div key={i} className="shrink-0" style={{ width: CARD_W - 8 }}>
                        <div
                          className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-[#0f0f10] p-1"
                          style={{ border: `1px solid ${r.color}` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.image_url} alt={g.name} className="h-full w-full object-contain" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {result && (
            <div className="w-full max-w-md text-center">
              <div className="text-sm text-white/50">Ты выбил</div>
              <div className="mt-2 text-2xl font-bold text-white">{result.name}</div>
              <div
                className="mt-2 inline-block rounded-lg px-3 py-1 text-xs font-bold uppercase"
                style={{
                  background: `${RARITY[result.rarity]?.color ?? "#666"}25`,
                  color: RARITY[result.rarity]?.color ?? "#999",
                }}
              >
                {RARITY[result.rarity]?.label ?? result.rarity}
              </div>

              <div
                className="mx-auto mt-6 flex h-48 w-48 items-center justify-center rounded-3xl bg-[#1c1c1e] p-4"
                style={{
                  border: `2px solid ${RARITY[result.rarity]?.color ?? "#333"}`,
                  boxShadow: `0 0 40px ${RARITY[result.rarity]?.color ?? "#333"}50`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.image_url} alt={result.name} className="h-full w-full object-contain" />
              </div>

              <div className="mt-4 text-sm text-white/50">
                +1 в инвентарь · ≈ {Number(result.base_price_ton).toFixed(2)} TON
              </div>

              <button
                onClick={closeAll}
                className="mt-6 w-full rounded-2xl bg-[#8B5CF6] py-4 text-lg font-bold text-white"
              >
                Забрать
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
