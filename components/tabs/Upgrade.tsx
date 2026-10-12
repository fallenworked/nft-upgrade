"use client";

import { useState } from "react";

export default function Upgrade() {
  const [myGift, setMyGift] = useState<string | null>(null);
  const [targetGift, setTargetGift] = useState<string | null>(null);

  const chance = 10; // временно, потом посчитаем

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-white">Upgrade ⬆️</h1>

      {/* Два слота: мой подарок → целевой */}
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex h-32 items-center justify-center rounded-2xl bg-[#1c1c1e] border border-white/5">
          {myGift ? (
            <div className="text-center">
              <div className="text-3xl">🎁</div>
              <div className="mt-1 text-xs text-white">{myGift}</div>
            </div>
          ) : (
            <div className="text-xs text-white/40 text-center px-2">
              Выбери<br />свой подарок
            </div>
          )}
        </div>

        <div className="text-xl text-[#A78BFA]">→</div>

        <div className="flex h-32 items-center justify-center rounded-2xl bg-[#1c1c1e] border border-white/5">
          {targetGift ? (
            <div className="text-center">
              <div className="text-3xl">💎</div>
              <div className="mt-1 text-xs text-white">{targetGift}</div>
            </div>
          ) : (
            <div className="text-xs text-white/40 text-center px-2">
              Выбери<br />целевой
            </div>
          )}
        </div>
      </div>

      {/* Шанс */}
      <div className="mb-4 rounded-2xl bg-[#1c1c1e] p-4 text-center">
        <div className="text-xs text-white/50">Шанс апгрейда</div>
        <div className="mt-1 text-3xl font-bold text-[#A78BFA]">{chance}%</div>
      </div>

      {/* Рулетка — пока заглушка */}
      <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-[#1c1c1e] border border-white/5">
        <div className="text-center">
          <div className="text-4xl">🎡</div>
          <div className="mt-2 text-xs text-white/40">
            Рулетка — скоро
          </div>
        </div>
      </div>

      {/* Кнопка */}
      <button
        disabled
        className="w-full rounded-2xl bg-[#8B5CF6]/40 py-4 text-lg font-semibold text-white/60"
      >
        Улучшить
      </button>

      <div className="mt-4 rounded-2xl bg-[#1c1c1e] p-4 text-center text-xs text-white/40">
        Инвентарь и каталог подарков — в разработке
      </div>
    </div>
  );
}
