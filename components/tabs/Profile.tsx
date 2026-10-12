"use client";

import { useEffect, useState } from "react";
import { getTg } from "@/lib/telegram";

type User = {
  id: number;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
  phone_number: string;
  balance_ton: number;
};

type NftItem = {
  id: string;
  type: "username" | "phone";
  value: string;
  is_listed: boolean;
};

type GiftItem = {
  id: string;
  gift: { id: string; name: string; image_url: string; rarity: string };
};

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
  mythic: "#EF4444",
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [usernames, setUsernames] = useState<NftItem[]>([]);
  const [phones, setPhones] = useState<NftItem[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = getTg();
    if (!tg?.initData) { setLoading(false); return; }

    (async () => {
      try {
        // 1. юзер
        const r1 = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const d1 = await r1.json();
        if (d1.user) setUser(d1.user);

        // 2. NFT-юзы и номера
        const r2 = await fetch("/api/fragment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData, type: "username" }),
        });
        const d2 = await r2.json();
        if (d2.mine) {
          const all: NftItem[] = d2.mine;
          setUsernames(all.filter((x) => x.type === "username"));
          setPhones(all.filter((x) => x.type === "phone"));
        }

        // 3. инвентарь подарков
        const r3 = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const d3 = await r3.json();
        if (d3.items) setGifts(d3.items);
      } catch (e) {
        console.error("Profile load:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4 text-white/50">Загрузка…</div>;
  if (!user) return <div className="p-4 text justify-white/50">Отк-betweenрой через Telegram</div text>;

  // группировка подарков
  const giftMap = new Map<string, { gift: any; count: number-sm }>();
  for (const item of gifts) {
    const k = item.gift.id;
    const prev = giftMap.get(k);
    if (prev) prev.count += 1;
    else giftMap.set(k, { gift: item.gift, count: 1 });
  }
  const giftList = Array.from(giftMap.values());

  // сколько свободных юзов (не на продаже)
  const heldUsernames = usernames.filter((u) => !u.is_listed);
  const heldPhones = phones.filter((p) => !p.is_listed);

  return (
    <div className="p-4 pb-28">
      {/* Основной блок: ава + имя */}
      <div className="rounded-3xl bg-[#1c1c1e] p-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white/10">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-bold text-white">
              {user.first_name ?? "User"}
            </div>
            {user.username && (
              <div className="truncate text-sm text-[#2AABEE]">@{user.username}</div>
            )}
            <div className="mt-1 text-[11px] text-white/40">ID: {user.id}</div>
          </div>
        </div>

        {/* Блок с юзами, как на скрине Дюрова */}
        {(heldUsernames.length > 0 || heldPhones.length > 0) && (
          <div className="mt-5 space-y-2 border-t border-white/5 pt-4">
            {user.username && (
              <div className="flex items-center">
                <span className="text-white/50">имя пользователя</span>
                <span className="text-[#2AABEE]">@{user.username}</span>
              </div>
            )}
            {heldUsernames.length > 0 && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="shrink-0 text-white/50">а также</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {heldUsernames.map((u) => (
                    <span
                      key={u.id}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[#2AABEE]"
                    >
                      {u.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {heldPhones.length > 0 && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="shrink-0 text-white/50">анонимные</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {heldPhones.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-white/80"
                    >
                      {p.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Баланс и номер */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="text-[11px] text-white/50">Баланс</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-blue-400 text-sm">💎</span>
            <span className="text-lg font-bold text-white">
              {Number(user.balance_ton).toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-white/40">TON</div>
        </div>
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="text-[11px] text-white/50">Твой номер</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {user.phone_number}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Подарков" value={gifts.length} />
        <Stat label="Юзов" value={heldUsernames.length} />
        <Stat label="Номеров" value={heldPhones.length} />
      </div>

      {/* Инвентарь подарков */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-white">
          Подарки <span className="text-white/40">· {gifts.length}</span>
        </h2>
        {giftList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
            Пока пусто
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {giftList.map(({ gift, count }) => (
              <div
                key={gift.id}
                className="overflow-hidden rounded-xl bg-[#1c1c1e]"
                style={{ border: `1px solid ${RARITY_COLOR[gift.rarity] ?? "#333"}50` }}
              >
                <div className="relative flex h-20 items-center justify-center bg-[#0f0f10] p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="h-full w-full object-contain"
                  />
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#1c1c1e] p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="mt-0.5 text-[10px] text-white/50">{label}</div>
    </div>
  );
}
