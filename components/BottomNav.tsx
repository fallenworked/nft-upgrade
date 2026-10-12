"use client";

export type TabKey = "gifts" | "upgrade" | "fragment" | "profile";

const ITEMS: { key: TabKey; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    key: "gifts",
    label: "Gifts",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M20 12v9H4v-9"/>
        <rect x="2" y="7" width="20" height="5" rx="1"/>
        <path d="M12 22V7"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    key: "upgrade",
    label: "Upgrade",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 16V8M8 12l4-4 4 4"/>
      </svg>
    ),
  },
  {
    key: "fragment",
    label: "Fragment",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
        <path d="M2 9h20M9 3l3 6 3-6M12 21l-3-12M12 21l3-12"/>
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>
      </svg>
    ),
  },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-2 pt-1.5">
        {ITEMS.map((it) => {
          const on = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition ${
                on ? "text-white" : "text-white/40"
              }`}
            >
              {it.icon(on)}
              <span className="text-[10px] font-medium tracking-wide">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
