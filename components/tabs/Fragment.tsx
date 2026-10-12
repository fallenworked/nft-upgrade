async function sell() {
    if (!sellItem || !tg?.initData) {
      setToast(`guard: sellItem=${!!sellItem} tg=${!!tg} initData=${!!tg?.initData}`);
      setTimeout(() => setToast(null), 5000);
      return;
    }
    try {
      const bodyStr = JSON.stringify({
        initData: tg.initData,
        itemId: sellItem.id,
        price: Number(sellPrice),
      });
      console.log("SELL BODY:", bodyStr.slice(0, 200));

      const r = await fetch("/api/fragment/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
      });

      const text = await r.text();
      console.log("SELL RESPONSE:", text);

      let d: any;
      try {
        d = JSON.parse(text);
      } catch {
        setToast(`Not JSON (${r.status}): ${text.slice(0, 150)}`);
        setTimeout(() => setToast(null), 8000);
        return;
      }

      if (d.error) {
        setToast(`API: ${d.error}`);
        setTimeout(() => setToast(null), 8000);
        return;
      }

      setSellItem(null);
      setSellPrice("");
      setToast("Выставлено");
      setTimeout(() => setToast(null), 2000);
      await load();
    } catch (e: any) {
      const msg = `catch: ${String(e)} | stack: ${String(e?.stack).slice(0, 150)}`;
      console.log(msg);
      setToast(msg);
      setTimeout(() => setToast(null), 8000);
    }
  }
