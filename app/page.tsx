"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [errors, setErrors] = useState<string[]>([]);
  const [tgStatus, setTgStatus] = useState("проверяю...");

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      setErrors((prev) => [...prev, `JS: ${e.message}`]);
    };
    const rejection = (e: PromiseRejectionEvent) => {
      setErrors((prev) => [...prev, `Promise: ${String(e.reason)}`]);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejection);

    setTimeout(() => {
      const tg = (window as any).Telegram;
      setTgStatus(tg ? "✅ ЕСТЬ" : "❌ НЕТ");
    }, 500);

    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejection);
    };
  }, []);

  return (
    <div style={{ padding: 20, background: "#0f0f0f", minHeight: "100vh", color: "#fff", fontFamily: "monospace" }}>
      <h1 className="text-2xl font-bold mb-4">ДИАГНОСТИКА</h1>
      <div className="mb-4 p-3 rounded bg-blue-900">
        Telegram WebApp: {tgStatus}
      </div>
      <div className="mb-2">Ошибок: {errors.length}</div>
      {errors.map((e, i) => (
        <div key={i} className="mt-2 p-2 bg-red-900 rounded text-xs break-all">
          {e}
        </div>
      ))}
    </div>
  );
}
