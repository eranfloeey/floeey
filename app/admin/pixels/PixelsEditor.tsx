"use client";

import { useState } from "react";

type Pixel = {
  id?: number;
  page: string;
  head_code: string;
  body_code: string;
  enabled: boolean;
  updated_at?: string;
};

const PAGES = [
  { value: "all", label: "כל העמודים" },
  { value: "home", label: "עמוד הבית (LP)" },
  { value: "admin", label: "אדמין" },
];

export default function PixelsEditor({ initial }: { initial: Pixel[] }) {
  const [pixels, setPixels] = useState<Pixel[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update(i: number, patch: Partial<Pixel>) {
    setPixels((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function add() {
    setPixels((arr) => [
      ...arr,
      { page: "all", head_code: "", body_code: "", enabled: true },
    ]);
  }

  async function save(p: Pixel, i: number) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "שגיאה");
      // Refresh list to get the assigned id
      const r = await fetch("/api/admin/pixels");
      const list = await r.json();
      if (list.ok) setPixels(list.pixels);
      setMsg({ type: "success", text: "נשמר" });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function remove(id: number) {
    if (!confirm("למחוק את הקוד?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/pixels?id=${id}`, { method: "DELETE" });
      setPixels((arr) => arr.filter((p) => p.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {msg ? <div className={`alert ${msg.type}`}>{msg.text}</div> : null}

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>קודים מותקנים</h3>
          <button className="primary" onClick={add}>+ קוד חדש</button>
        </div>
      </div>

      {pixels.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>
            אין קודים מותקנים. הוסף קוד חדש כדי להתחיל.
          </p>
        </div>
      ) : null}

      {pixels.map((p, i) => (
        <div className="card" key={p.id ?? `new-${i}`}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div className="row">
              <strong style={{ fontSize: 15 }}>
                {PAGES.find((x) => x.value === p.page)?.label || p.page}
              </strong>
              <span className={"pill " + (p.enabled ? "green" : "gray")}>
                {p.enabled ? "פעיל" : "כבוי"}
              </span>
              {p.id ? <span className="pill gray">#{p.id}</span> : <span className="pill pink">חדש</span>}
            </div>
            <div className="row">
              <button className="primary" onClick={() => save(p, i)} disabled={busy}>שמור</button>
              {p.id ? (
                <button className="danger" onClick={() => remove(p.id!)} disabled={busy}>מחק</button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <label className="field">
              <span>עמוד</span>
              <select value={p.page} onChange={(e) => update(i, { page: e.target.value })}>
                {PAGES.map((x) => (
                  <option key={x.value} value={x.value}>{x.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>פעיל</span>
              <select
                value={p.enabled ? "1" : "0"}
                onChange={(e) => update(i, { enabled: e.target.value === "1" })}
              >
                <option value="1">פעיל</option>
                <option value="0">כבוי</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>קוד &lt;head&gt; (פיקסלים, אנליטיקס וכו')</span>
            <textarea
              value={p.head_code}
              onChange={(e) => update(i, { head_code: e.target.value })}
              placeholder={'<!-- Meta Pixel -->\n<script>...</script>'}
              dir="ltr"
            />
          </label>
          <label className="field">
            <span>קוד &lt;body&gt; (תחילת ה-body)</span>
            <textarea
              value={p.body_code}
              onChange={(e) => update(i, { body_code: e.target.value })}
              placeholder={'<noscript>...</noscript>'}
              dir="ltr"
            />
          </label>
        </div>
      ))}
    </>
  );
}
