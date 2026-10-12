"use client";

export type TabKey = "gifts" | "upgrade" | "fragment" | "profile";

const ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: "gifts", label: "Gifts", icon: "🎁" },
  { key: "upgrade", label: "Upgrade", icon: "⬆️" },
  { key: "fragment", label: "Fragment", icon: "💎" },
  { key: "profile", label: "Profile", icon: "👤" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#1a1a1a]/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {ITEMS.map((it) => {
          const on = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] transition ${
                on ? "text-[#2AABEE]" : "text-white/50"
              }`}
            >
              <span className="text-xl">{it.icon}</span>
              <span className="font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
