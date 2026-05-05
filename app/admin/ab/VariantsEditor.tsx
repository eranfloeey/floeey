"use client";

import { useState } from "react";

type Override = { h1_html?: string; lead_html?: string; cta_text?: string };
type Variant = {
  id: string;
  name: string;
  weight: number;
  is_control: boolean;
  enabled: boolean;
  overrides: Override;
};

export default function VariantsEditor({ initial }: { initial: Variant[] }) {
  const [variants, setVariants] = useState<Variant[]>(
    initial.length
      ? initial
      : [
          {
            id: "control",
            name: "Control",
            weight: 100,
            is_control: true,
            enabled: true,
            overrides: {},
          },
        ]
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const total = variants.filter((v) => v.enabled).reduce((s, v) => s + (v.weight || 0), 0);

  function update(i: number, patch: Partial<Variant>) {
    setVariants((arr) => arr.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function updateOverride(i: number, patch: Partial<Override>) {
    setVariants((arr) =>
      arr.map((v, idx) => (idx === i ? { ...v, overrides: { ...v.overrides, ...patch } } : v))
    );
  }

  function addVariant() {
    const id = "variant-" + (Date.now().toString(36).slice(-4));
    setVariants((arr) => [
      ...arr,
      {
        id,
        name: "וריאנט חדש",
        weight: 0,
        is_control: false,
        enabled: true,
        overrides: {},
      },
    ]);
  }

  async function save(v: Variant) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "שגיאה");
      setMsg({ type: "success", text: `נשמר: ${v.name}` });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function remove(id: string) {
    if (!confirm(`למחוק את הוריאנט ${id}?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/variants?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setVariants((arr) => arr.filter((v) => v.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {msg ? <div className={`alert ${msg.type}`}>{msg.text}</div> : null}

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>וריאנטים פעילים</h3>
          <button className="primary" onClick={addVariant}>+ וריאנט חדש</button>
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          סה"כ משקלים פעילים: <strong>{total}</strong> · הסרבר מחלק את התנועה יחסית למשקלים (לא חייב לסכם ל-100).
        </p>
      </div>

      {variants.map((v, i) => (
        <div className="card" key={v.id}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div className="row">
              <strong style={{ fontSize: 16 }}>{v.name}</strong>
              <span className="pill gray">{v.id}</span>
              {v.is_control ? <span className="pill pink">CONTROL</span> : null}
              <span className={"pill " + (v.enabled ? "green" : "gray")}>
                {v.enabled ? "פעיל" : "כבוי"}
              </span>
            </div>
            <div className="row">
              <button className="primary" onClick={() => save(v)} disabled={busy}>שמור</button>
              {!v.is_control ? (
                <button className="danger" onClick={() => remove(v.id)} disabled={busy}>מחק</button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <label className="field">
              <span>שם תצוגה</span>
              <input value={v.name} onChange={(e) => update(i, { name: e.target.value })} />
            </label>
            <label className="field">
              <span>משקל (יחסי)</span>
              <input
                type="number"
                min={0}
                value={v.weight}
                onChange={(e) => update(i, { weight: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span>פעיל</span>
              <select
                value={v.enabled ? "1" : "0"}
                onChange={(e) => update(i, { enabled: e.target.value === "1" })}
              >
                <option value="1">פעיל</option>
                <option value="0">כבוי</option>
              </select>
            </label>
            <label className="field">
              <span>Control (ברירת מחדל)</span>
              <select
                value={v.is_control ? "1" : "0"}
                onChange={(e) => update(i, { is_control: e.target.value === "1" })}
              >
                <option value="0">לא</option>
                <option value="1">כן</option>
              </select>
            </label>
          </div>

          <h3 style={{ marginTop: 8 }}>שינויי קופי בהירו</h3>
          <p className="muted" style={{ fontSize: 12 }}>
            השאר ריק כדי להשתמש בברירת המחדל. תומך ב-HTML (כמו &lt;br/&gt; ו-&lt;span class="m"&gt;).
          </p>

          <label className="field">
            <span>כותרת ראשית (h1)</span>
            <textarea
              value={v.overrides.h1_html || ""}
              onChange={(e) => updateOverride(i, { h1_html: e.target.value })}
              placeholder='תכיר את <span class="m">מנחם</span>.<br/>הוא עונה ומתקשר<br/>לכל לקוח תוך שניות.'
            />
          </label>
          <label className="field">
            <span>תת-כותרת (lead)</span>
            <textarea
              value={v.overrides.lead_html || ""}
              onChange={(e) => updateOverride(i, { lead_html: e.target.value })}
              placeholder="סוכן AI טלפוני בעברית..."
            />
          </label>
          <label className="field">
            <span>טקסט הכפתור</span>
            <input
              value={v.overrides.cta_text || ""}
              onChange={(e) => updateOverride(i, { cta_text: e.target.value })}
              placeholder="מנחם תתקשר להדגים לי"
            />
          </label>
        </div>
      ))}
    </>
  );
}
