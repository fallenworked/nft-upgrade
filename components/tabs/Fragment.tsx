"use client";
export default function Gifts() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Gifts 🎁</h1>
      <div className="grid gap-3">
        {["Free Case", "Common Case", "Premium Case"].map((n) => (
          <div key={n} className="rounded-2xl bg-[#1c1c1e] p-4">
            <div className="font-semibold">{n}</div>
            <div className="text-xs text-white/50">
              Скоро: рулетка и выпадение подарков
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
