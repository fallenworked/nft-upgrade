"use client";

import { useEffect, useState, useCallback } from "react";
import { getTg } from "@/lib/telegram";

type Item = {
  id: string;
  type: "username" | "phone";
  value: string;
  price_ton: number;
  is_listed: boolean;
  owner_id: number | null;
};

type User = { id: number; balance_ton: number; avatar_url: string | null; first_name: string | null };

export default function Fragment() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"username" | "phone">("username");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [mine, setMine] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [buyItem, setBuyItem] = useState<Item | null>(null);
  const [sellItem, setSellItem] = useState<Item | null>(null);
  const [sellPrice, setSellPrice] = useState("");

  const tg = typeof window !== "undefined" ? getTg() : null;

  const load = useCallback(async () => {
    if (!tg?.initData) return;
    setLoading(true);
    try {
      const r = await fetch("/api/fragment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData, type: tab, search }),
      });
      const d = await r.json();
      if (d.items) setItems(d.items);
      if (d.mine) setMine(d.mine);

      const r2 = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData }),
      });
      const d2 = await r2.json();
      if (d2.user) setUser(d2.user);
    } finally {
      setLoading(false);
    }
  }, [tg?.initData, tab, search]);

  useEffect(() => {
    const t = getTg();
    if (!t?.initData) { setLoading(false); return; }
    load();
  }, [load]);

  async function buy() {
    if (!buyItem || !tg?.initData) return;
    try {
      const r = await fetch("/api/fragment/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData, itemId: buyItem.id }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setUser((u) => u ? { ...u, balance_ton: Number(d.newBalance) } : u);
      setBuyItem(null);
      setToast(`Куплено: ${buyItem.value}`);
      setTimeout(() => setToast(null), 2000);
      await load();
    } catch (e: any) {
      setToast(e.message ?? "Ошибка");
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function sell() {
    if (!sellItem || !tg?.initData) return;
    try {
      const r = await fetch("/api/fragment/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: tg.initData,
          itemId: sellItem.id,
          price: Number(sellPrice),
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSellItem(null);
      setSellPrice("");
      setToast("Выставлено");
      setTimeout(() => setToast(null), 2000);
      await load();
    } catch (e: any) {
      setToast(e.message ?? "Ошибка");
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function unlist(item: Item) {
    if (!tg?.initData) return;
    await fetch("/api/fragment/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, itemId: item.id, unlist: true }),
    });
    await load();
  }

  return (
    <div className="p-4 pb-28">
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
      </div>

      <h1 className="mb-4 mt-2 text-[28px] font-bold text-white">Fragment</h1>

      <div className="mb-3 flex gap-2 rounded-xl bg-[#1c1c1e] p-1">
        {(["username", "phone"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white/10 text-white" : "text-white/40"
            }`}
          >
            {t === "username" ? "Usernames" : "Numbers"}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#1c1c1e] px-3 py-2.5">
        <span className="text-white/40">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "username" ? "Поиск юзернейма..." : "Поиск номера..."}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-white/40">✕</button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-white/40">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
          Ничего не найдено
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-[#1c1c1e]">
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setBuyItem(it)}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition active:bg-white/5 ${
                i !== 0 ? "border-t border-white/5" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{it.value}</div>
                <div className="mt-0.5 text-[11px] text-[#2AABEE]">
                  {it.type === "username"
                    ? `${it.value.replace("@", "")}.t.me`
                    : "Anonymous number"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400 text-xs">💎</span>
                    <span className="text-sm font-bold text-white">
                      {Number(it.price_ton).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-white/30">›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {mine.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-medium text-white">
            Мои активы <span className="text-white/30">· {mine.length}</span>
          </h2>
          <div className="overflow-hidden rounded-2xl bg-[#1c1c1e]">
            {mine.map((it, i) => (
              <div
                key={it.id}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  i !== 0 ? "border-t border-white/5" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{it.value}</div>
                  <div className="mt-0.5 text-[11px] text-white/40">
                    {it.is_listed
                      ? `На продаже · ${Number(it.price_ton).toLocaleString()} TON`
                      : "Не выставлено"}
                  </div>
                </div>
                {it.is_listed ? (
                  <button
                    onClick={() => unlist(it)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Снять
                  </button>
                ) : (
                  <button
                    onClick={() => { setSellItem(it); setSellPrice(""); }}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Продать
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {buyItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 p-4"
          onClick={() => setBuyItem(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#1c1c1e] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-xs text-white/50">Покупка</div>
              <div className="mt-1 text-2xl font-bold text-white">{buyItem.value}</div>
              {buyItem.type === "username" && (
                <div className="mt-1 text-xs text-[#2AABEE]">
                  {buyItem.value.replace("@", "")}.t.me
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2 rounded-2xl bg-white/5 p-4">
              <Row label="Цена">
                <span className="font-bold">💎 {Number(buyItem.price_ton).toLocaleString()} TON</span>
              </Row>
              <Row label="Твой баланс">
                <span>💎 {Number(user?.balance_ton ?? 0).toFixed(2)} TON</span>
              </Row>
              <Row label="После покупки">
                <span className={Number(user?.balance_ton ?? 0) >= buyItem.price_ton ? "text-green-400" : "text-red-400"}>
                  💎 {(Number(user?.balance_ton ?? 0) - buyItem.price_ton).toFixed(2)} TON
                </span>
              </Row>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setBuyItem(null)}
                className="rounded-xl bg-white/5 py-3 text-sm font-semibold text-white"
              >
                Отмена
              </button>
              <button
                onClick={buy}
                disabled={Number(user?.balance_ton ?? 0) < buyItem.price_ton}
                className="rounded-xl bg-white/10 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Купить
              </button>
            </div>
          </div>
        </div>
      )}

      {sellItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 p-4"
          onClick={() => setSellItem(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#1c1c1e] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-xs text-white/50">Выставить на продажу</div>
              <div className="mt-1 text-2xl font-bold text-white">{sellItem.value}</div>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs text-white/50">Цена в TON</div>
              <input
                type="number"
                inputMode="decimal"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-lg font-bold text-white outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSellItem(null)}
                className="rounded-xl bg-white/5 py-3 text-sm font-semibold text-white"
              >
                Отмена
              </button>
              <button
                onClick={sell}
                disabled={!sellPrice || Number(sellPrice) <= 0}
                className="rounded-xl bg-white/10 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Выставить
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[10000] max-w-[90%] -translate-x-1/2 rounded-xl bg-white/15 px-4 py-2 text-center text-xs text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className="text-white">{children}</span>
    </div>
  );
}
