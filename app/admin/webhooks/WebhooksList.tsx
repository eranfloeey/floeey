"use client";

import Link from "next/link";
import { useState } from "react";
import type { Webhook } from "@/lib/db";

const EMPTY: Webhook = {
  name: "",
  url: "",
  form_id: "",
  enabled: true,
  secret: "",
  headers: {},
  body_template: "",
};

export default function WebhooksList({ initial }: { initial: Webhook[] }) {
  const [items, setItems] = useState<Webhook[]>(initial);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Webhook>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/admin/webhooks", { cache: "no-store" }).then((r) => r.json());
    if (r.ok) setItems(r.webhooks);
  }

  async function save(w: Webhook) {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(w),
      }).then((r) => r.json());
      if (!r.ok) throw new Error(r.error || "save failed");
      await refresh();
      if (!w.id) {
        setDraft(EMPTY);
        setCreating(false);
      }
    } catch (e: any) {
      setErr(e?.message || "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(w: Webhook) {
    await save({ ...w, enabled: !w.enabled });
  }

  async function remove(id: number) {
    if (!confirm("למחוק את הוובהוק? כל ההיסטוריה תימחק גם.")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/webhooks?id=${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {err ? <div className="alert error">{err}</div> : null}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>שם</th>
              <th>URL</th>
              <th>טופס</th>
              <th style={{ width: 220 }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 36, color: "#8b8b98" }}>
                  עוד אין וובהוקים. הוסף את הראשון למטה.
                </td>
              </tr>
            ) : (
              items.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span
                      title={w.enabled ? "פעיל" : "מושבת"}
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: w.enabled ? "#22c55e" : "#52525b",
                      }}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/webhooks/${w.id}`} style={{ color: "#fff", fontWeight: 700 }}>
                      {w.name}
                    </Link>
                  </td>
                  <td dir="ltr" style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#b8b8c4", maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {w.url}
                  </td>
                  <td>
                    {w.form_id ? <span className="pill pink">{w.form_id}</span> : <span className="pill gray">כל הטפסים</span>}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <button className="ghost" onClick={() => toggle(w)} disabled={busy}>
                        {w.enabled ? "השבת" : "הפעל"}
                      </button>
                      <Link
                        href={`/admin/webhooks/${w.id}`}
                        style={{
                          display: "inline-block",
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#b8b8c4",
                          padding: "9px 16px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        ניהול
                      </Link>
                      <button className="danger" onClick={() => remove(w.id!)} disabled={busy}>
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating ? (
        <div className="card">
          <h3>וובהוק חדש</h3>
          <Editor
            value={draft}
            onChange={setDraft}
            onCancel={() => {
              setCreating(false);
              setDraft(EMPTY);
              setErr(null);
            }}
            onSave={() => save(draft)}
            busy={busy}
          />
        </div>
      ) : (
        <button className="primary" onClick={() => setCreating(true)} style={{ marginTop: 18 }}>
          + הוסף וובהוק
        </button>
      )}
    </div>
  );
}

// Stringify headers as JSON for the textarea, swallowing the case where the
// value comes back as a string from the API (older rows) or as null.
function headersToText(h: Webhook["headers"]) {
  if (!h) return "";
  if (typeof h === "string") return h;
  const keys = Object.keys(h);
  if (!keys.length) return "";
  return JSON.stringify(h, null, 2);
}

export function Editor({
  value,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  value: Webhook;
  onChange: (w: Webhook) => void;
  onSave: () => void;
  onCancel?: () => void;
  busy: boolean;
}) {
  // Headers + body template are local string state — we only roll them back
  // into the parent webhook on save, so the user can type freely without
  // every keystroke triggering a JSON.parse error in the parent.
  const [headersText, setHeadersText] = useState(headersToText(value.headers));
  const [headersErr, setHeadersErr] = useState<string | null>(null);

  function commitHeaders(text: string) {
    setHeadersText(text);
    if (!text.trim()) {
      setHeadersErr(null);
      onChange({ ...value, headers: {} });
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setHeadersErr(null);
        onChange({ ...value, headers: parsed });
      } else {
        setHeadersErr("צריך להיות object של key/value");
      }
    } catch {
      setHeadersErr("JSON לא תקין");
    }
  }

  return (
    <div>
      <label className="field">
        <span>שם</span>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="למשל: NLPearl / Make / Zapier"
        />
      </label>
      <label className="field">
        <span>URL</span>
        <input
          type="text"
          dir="ltr"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          placeholder="https://api.example.com/webhook"
        />
      </label>
      <div className="row" style={{ gap: 12, alignItems: "stretch" }}>
        <label className="field" style={{ flex: 1 }}>
          <span>Form ID (אופציונלי — ריק = כל הטפסים)</span>
          <input
            type="text"
            value={value.form_id ?? ""}
            onChange={(e) => onChange({ ...value, form_id: e.target.value })}
            placeholder="main"
          />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>Secret (אופציונלי — נשלח כ-x-floeey-secret header)</span>
          <input
            type="text"
            dir="ltr"
            value={value.secret ?? ""}
            onChange={(e) => onChange({ ...value, secret: e.target.value })}
            placeholder=""
          />
        </label>
      </div>

      <label className="field">
        <span>
          Custom Headers (JSON) — לדוגמה Authorization, X-Api-Key. דוחק על
          content-type/user-agent ברירת המחדל.
        </span>
        <textarea
          dir="ltr"
          value={headersText}
          onChange={(e) => commitHeaders(e.target.value)}
          placeholder={`{\n  "Authorization": "Bearer abc123:xyz"\n}`}
          style={{ minHeight: 100 }}
        />
        {headersErr ? <div className="alert error" style={{ marginTop: 6 }}>{headersErr}</div> : null}
      </label>

      <label className="field">
        <span>
          Body Template (אופציונלי — ריק = שולח את ה-envelope של Floeey).
          Placeholders: {"{{name}}, {{phone}}, {{phone_e164}}, {{form_id}}, {{lead_id}}, {{utm_source}}, …"}
        </span>
        <textarea
          dir="ltr"
          value={value.body_template ?? ""}
          onChange={(e) => onChange({ ...value, body_template: e.target.value })}
          placeholder={`{\n  "phoneNumber": "{{phone_e164}}",\n  "callData": {\n    "customerName": "{{name}}"\n  }\n}`}
          style={{ minHeight: 140 }}
        />
      </label>

      <label className="field" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          style={{ width: "auto" }}
        />
        <span style={{ margin: 0 }}>פעיל</span>
      </label>
      <div className="row" style={{ gap: 8 }}>
        <button className="primary" onClick={onSave} disabled={busy || !value.name || !value.url || !!headersErr}>
          {busy ? "שומר..." : "שמור"}
        </button>
        {onCancel ? (
          <button className="ghost" onClick={onCancel} disabled={busy}>
            ביטול
          </button>
        ) : null}
      </div>
    </div>
  );
}
