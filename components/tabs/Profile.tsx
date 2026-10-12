"use client";

import { useEffect, useState } from "react";
import { getTg } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

type UserRow = {
  id: number;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
  phone_number: string;
  balance_ton: number;
};

type NftRow = {
  id: string;
  type: "username" | "phone";
  value: string;
};

function randomPhone() {
  // +7 (9xx) xxx-xx-xx
  const a = 900 + Math.floor(Math.random() * 100);
  const b = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const c = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  const d = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `+7 (${a}) ${b}-${c}-${d}`;
}

export default function Profile() {
  const [me, setMe] = useState<UserRow | null>(null);
  const [nfts, setNfts] = useState<NftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const tg = getTg();
      const tgUser = tg?.initDataUnsafe?.user;
      if (!tgUser) {
        setLoading(false);
        return;
      }

      // upsert пользователя
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("id", tgUser.id)
        .maybeSingle();

      let user = existing as UserRow | null;

      if (!user) {
        const { data: created } = await supabase
          .from("users")
          .insert({
            id: tgUser.id,
            username: tgUser.username ?? null,
            first_name: tgUser.first_name ?? null,
            avatar_url: tgUser.photo_url ?? null,
            phone_number: randomPhone(),
            balance_ton: 100,
          })
          .select("*")
          .single();
        user = created as UserRow;
      }

      setMe(user);

      const { data: owned } = await supabase
        .from("nft_usernames")
        .select("id,type,value")
        .eq("owner_id", tgUser.id);

      setNfts((owned as NftRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4 text-white/50">Загрузка…</div>;
  if (!me) return <div className="p-4 text-white/50">Открой через Telegram</div>;

  const extra = nfts.filter((n) => n.type === "username").map((n) => n.value);
  const phones = nfts.filter((n) => n.type === "phone").map((n) => n.value);

  return (
    <div className="p-4">
      {/* Шапка профиля */}
      <div className="mb-4 rounded-2xl bg-[#1c1c1e] p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
            {me.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">
              {me.first_name ?? "User"}
            </div>
            {me.username && (
              <div className="truncate text-sm text-[#2AABEE]">
                @{me.username}
              </div>
            )}
            <div className="text-xs text-white/50">ID: {me.id}</div>
          </div>
        </div>

        {/* Блок с юзернеймами, как на скрине */}
        {(extra.length > 0 || phones.length > 0) && (
          <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
            {me.username && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">имя пользователя</span>
                <span className="text-[#2AABEE]">@{me.username}</span>
              </div>
            )}
            {extra.length > 0 && (
              <div className="text-sm">
                <div className="text-white/50">а также</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {extra.map((u) => (
                    <span
                      key={u}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[#2AABEE]"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {phones.length > 0 && (
              <div className="text-sm">
                <div className="text-white/50">анонимные номера</div>
                <div className="mt-1 flex flex-col gap-1">
                  {phones.map((p) => (
                    <span key={p} className="text-white/80">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Баланс и телефон */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="text-xs text-white/50">Баланс</div>
          <div className="mt-1 text-xl font-bold">
            {Number(me.balance_ton).toFixed(2)}{" "}
            <span className="text-sm text-white/40">TON</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#1c1c1e] p-4">
          <div className="text-xs text-white/50">Твой номер</div>
          <div className="mt-1 text-sm font-medium">{me.phone_number}</div>
        </div>
      </div>
    </div>
  );
}
