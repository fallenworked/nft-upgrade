"use client";

import { useEffect, useState } from "react";
import BottomNav, { type TabKey } from "@/components/BottomNav";
import Gifts from "@/components/tabs/Gifts";
import { initTelegram } from "@/lib/telegram";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("gifts");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initTelegram();
    } catch (e: any) {
      setError(`initTelegram: ${e?.message ?? e}`);
    }
    const handler = (e: ErrorEvent) => setError(`JS: ${e.message}`);
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, background: "#0f0f0f", color: "#ff5555", minHeight: "100vh", fontFamily: "monospace" }}>
        <h2>ОШИБКА:</h2>
        <div className="mt-2 text-xs break-all">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {tab === "gifts" && <Gifts />}
      {tab === "upgrade" && <div className="p-4 text-white">Upgrade</div>}
      {tab === "fragment" && <div className="p-4 text-white">Fragment</div>}
      {tab === "profile" && <div className="p-4 text-white">Profile</div>}
      <BottomNav active={tab} onChange={setTab} />
    </main>
  );
}
