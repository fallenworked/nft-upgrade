export default function Home() {
  return (
    <div style={{ padding: 40, background: "#0f0f0f", minHeight: "100vh" }}>
      <h1 className="text-4xl text-white font-bold">ТЕСТ 123</h1>
      <p className="text-[#2AABEE] mt-4">Если видишь синий текст — Tailwind работает</p>
      <div className="mt-8 p-4 bg-red-500 rounded-xl">Красный блок</div>
    </div>
  );
}
