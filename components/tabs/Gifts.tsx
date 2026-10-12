"use client";

import { useEffect, useState } from "react";
import { getTg } from "@/lib/telegram";

type Case = {
  id: string;
  slug: string;
  name: string;
  price_ton: number;
  is_free: boolean;
};

type Gift = {
  id: string;
  name: string;
  rarity: string;
  image_url: string;
  base_price_ton: number;
};

type User = {
  id: number;
  balance_ton: number;
  avatar_url: string | null;
  first_name: string | null;
  username: string | null;
};

const RARITY_COLOR: Record<string, string> = {
  common: "#6B7280",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
  mythic: "#EF4444",
};

const CARD_W = 110; // ширина карточки в рулетке
const REEL_SIZE = 50;
const WINNER_INDEX = 45;

export default function Gifts() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const [opening, setOpening] = useState<Case | null>(null);
  const [reel, setReel] = useState<Gift[]>([]);
  const [translate, setTranslate] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [result, setResult] = useState<Gift | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const tg = getTg();
    if (!tg?.initData) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r1 = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const d1 = await r1.json();
        if (d1.user) setUser(d1.user);

        const r2 = await fetch("/api/cases");
        const d2 = await r2.json();
        if (d2.cases) setCases(d2.cases);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleOpen(c: Case) {
    const tg = getTg();
    if (!tg?.initData) return;
    setOpening(c);
    setResult(null);
    setSpinning(true);
    setAnimate(false);
    setTranslate(0);

    try {
      const r = await fetch("/api/cases/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData, caseSlug: c.slug }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      const winner: Gift = d.gift;
      const pool: Gift[] = d.allGifts ?? [winner];

      const fill: Gift[] = Array.from({ length: REEL_SIZE }, (_, i) =>
        i === WINNER_INDEX
          ? winner
          : pool[Math.floor(Math.random() * pool.length)]
      );
      setReel(fill);

      // запускаем анимацию на след. кадре
      requestAnimationFrame(() => {
        setTimeout(() => {
          setAnimate(true);
          setTranslate(-(WINNER_INDEX * CARD_W) + 40);
        }, 30);
      });

      // финализируем
      setTimeout(() => {
        setSpinning(false);
        setResult(winner);
        setUser((u) =>
          u ? { ...u, balance_ton: Number(d.newBalance) } : u
        );
      }, 4300);
    } catch (e: any) {
      setToast(e.message ?? "Ошибка");
      setTimeout(() => setToast(null), 2500);
      setSpinning(false);
      setOpening(null);
    }
  }

  function closeModal() {
    if (spinning) return;
    setOpening(null);
    setResult(null);
    setReel([]);
    setTranslate(0);
    setAnimate(false);
  }

  if (loading) {
    return <div className="p-4 text-white/50">Загрузка…</div>;
  }

  return (
    <div className="p-4 pb-24">
      {/* Хедер с балансом */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">👤</div>
            )}
          </div>
          <div>
            <div className="text-[11px] text-white/50">Ваш баланс</div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">💎</span>
              <span className="text-lg font-bold text-white">
                {Number(user?.balance_ton ?? 0).toFixed(2)}
              </span>
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
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => !spinning && handleOpen(c)}
            className="flex flex-col overflow-hidden rounded-2xl bg-[#1c1c1e] text-left transition active:scale-95"
            style={{ border: `1px solid ${c.is_free ? "#F59E0B" : "#8B5CF6"}40` }}
          >
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#2a2a2e] to-[#151517] text-5xl">
              🎁
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="text-sm font-semibold text-white">{c.name}</div>
              <div
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  c.is_free ? "bg-yellow-500/20 text-yellow-400" : "bg-[#8B5CF6]/20 text-[#A78BFA]"
                }`}
              >
                {c.is_free ? "FREE" : `${c.price_ton} TON`}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Модалка рулетки */}
      {opening && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <div className="mb-6 text-center">
            <div className="text-sm text-white/50">Открываем кейс</div>
            <div className="text-xl font-bold text-white">{opening.name}</div>
          </div>

          {/* Рулетка */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1c1c1e] py-6">
            {/* Указатель */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-0.5 -translate-x-1/2 bg-[#A78BFA]" />
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-lg bg-[#A78BFA] px-2 py-1 text-[10px] font-bold text-black">
              ▼
            </div>

            <div
              className="flex gap-2 will-change-transform"
              style={{
                transform: `translateX(${translate}px)`,
                transition: animate
                  ? "transform 4s cubic-bezier(0.15, 0.9, 0.15, 1)"
                  : "none",
              }}
            >
              {reel.map((g, i) => (
                <div
                  key={i}
                  className="flex shrink-0 flex-col items-center"
                  style={{ width: CARD_W - 8 }}
                >
                  <div
                    className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-[#0f0f10]"
                    style={{ border: `1px solid ${RARITY_COLOR[g.rarity] ?? "#333"}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.image_url}
                      alt={g.name}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="mt-1 w-full truncate text-center text-[10px] text-white/60">
                    {g.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Результат */}
          {result && (
            <div className="mt-6 w-full max-w-md rounded-2xl bg-[#1c1c1e] p-4 text-center">
              <div className="text-xs text-white/50">Ты выбил</div>
              <div className="mt-1 text-lg font-bold text-white">{result.name}</div>
              <div
                className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: `${RARITY_COLOR[result.rarity]}30`,
                  color: RARITY_COLOR[result.rarity],
                }}
              >
                {result.rarity}
              </div>
              <div className="mt-2 text-xs text-white/40">
                ≈ {Number(result.base_price_ton).toFixed(2)} TON
              </div>
              <button
                onClick={closeModal}
                className="mt-4 w-full rounded-xl bg-[#8B5CF6] py-3 font-semibold text-white"
              >
                Забрать
              </button>
            </div>
          )}

          {/* Кнопка отмены пока крутится */}
          {spinning && !result && (
            <div className="mt-6 text-xs text-white/40">Крутим…</div>
          )}
        </div>
      )}

      {/* Тост ошибок */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
