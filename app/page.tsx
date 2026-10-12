"use client";

import { useEffect, useState } from "react";
import BottomNav, { type TabKey } from "@/components/BottomNav";
import Gifts from "@/components/tabs/Gifts";
import Upgrade from "@/components/tabs/Upgrade";
import Fragment from "@/components/tabs/Fragment";
import Profile from "@/components/tabs/Profile";
import { initTelegram } from "@/lib/telegram";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("gifts");

  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <main className="min-h-screen pb-20">
      {tab === "gifts" && <Gifts />}
      {tab === "upgrade" && <Upgrade />}
      {tab === "fragment" && <Fragment />}
      {tab === "profile" && <Profile />}
      <BottomNav active={tab} onChange={setTab} />
    </main>
  );
}
