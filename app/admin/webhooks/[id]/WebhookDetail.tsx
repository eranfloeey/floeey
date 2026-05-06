"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Webhook, WebhookLog } from "@/lib/db";
import { Editor } from "../WebhooksList";

export default function WebhookDetail({
  hook,
  initialLogs,
}: {
  hook: Webhook;
  initialLogs: WebhookLog[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Webhook>(hook);
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [openLog, setOpenLog] = useState<number | null>(null);

  async function save() {
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      }).then((r) => r.json());
      if (!r.ok) throw new Error(r.error || "save failed");
      setMsg({ kind: "ok", text: "נשמר ✓" });
      router.refresh();
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "save failed" });
    } finally {
      setBusy(false);
    }
  }

  async function refreshLogs() {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/webhooks/${hook.id}/logs`, { cache: "no-store" }).then((r) =>
        r.json()
      );
      if (r.ok) setLogs(r.logs);
    } finally {
      setBusy(false);
    }
  }

  async function fireTest() {
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/webhooks/${hook.id}/test`, { method: "POST" }).then((r) =>
        r.json()
      );
      setMsg({
        kind: r.ok ? "ok" : "err",
        text: r.ok ? `נשלח בהצלחה (status ${r.status})` : `נכשל: ${r.error || r.status || ""}`,
      });
      await refreshLogs();
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "test failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      {msg ? <div className={`alert ${msg.kind === "ok" ? "success" : "error"}`}>{msg.text}</div> : null}

      <div className="card">
        <h3>הגדרות</h3>
        <Editor value={draft} onChange={setDraft} onSave={save} busy={busy} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 18, paddingTop: 16 }}>
          <button className="ghost" onClick={fireTest} disabled={busy}>
            שלח בדיקה →
          </button>
          <span style={{ marginInlineStart: 12, fontSize: 13, color: "#8b8b98" }}>
            שולח payload מדומה ל-URL ורושם בלוג.
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin: 0 }}>היסטוריית שליחות</h3>
          <button className="ghost" onClick={refreshLogs} disabled={busy}>
            רענן
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>סטטוס</th>
              <th>משך</th>
              <th>Lead</th>
              <th>תקציר</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 36, color: "#8b8b98" }}>
                  אין עדיין שליחות. שלח בדיקה או חכה ללידים.
                </td>
              </tr>
            ) : (
              logs.flatMap((log) => {
                const rows = [
                  <tr key={log.id} onClick={() => setOpenLog(openLog === log.id ? null : log.id!)} style={{ cursor: "pointer" }}>
                    <td style={{ fontSize: 12 }}>{formatDate(log.sent_at)}</td>
                    <td>
                      {log.success ? (
                        <span className="pill green">✓ {log.response_status ?? "OK"}</span>
                      ) : log.response_status ? (
                        <span className="pill" style={{ background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}>
                          {log.response_status}
                        </span>
                      ) : (
                        <span className="pill" style={{ background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}>
                          {log.error || "fail"}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "#b8b8c4" }}>{log.duration_ms ? `${log.duration_ms}ms` : "-"}</td>
                    <td style={{ fontSize: 12, color: "#b8b8c4" }}>{log.lead_id ?? "-"}</td>
                    <td style={{ fontSize: 12, color: "#8b8b98" }}>
                      {log.error ? log.error : `${(log.response_body ?? "").slice(0, 80)}${(log.response_body ?? "").length > 80 ? "…" : ""}`}
                    </td>
                  </tr>,
                ];
                if (openLog === log.id) {
                  rows.push(
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={5} style={{ background: "#0a0a10", padding: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#8b8b98", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                              Request body
                            </div>
                            <pre style={preStyle}>{prettyJson(log.request_body)}</pre>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#8b8b98", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                              Response{log.response_status ? ` (${log.response_status})` : ""}
                            </div>
                            <pre style={preStyle}>
                              {log.error
                                ? `error: ${log.error}`
                                : log.response_body || "(empty)"}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  background: "#14141c",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 8,
  padding: 12,
  fontSize: 12,
  fontFamily: "ui-monospace, monospace",
  color: "#e8e8ee",
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  maxHeight: 320,
  overflow: "auto",
  direction: "ltr",
  textAlign: "left",
};

function prettyJson(v: any) {
  try {
    return JSON.stringify(typeof v === "string" ? JSON.parse(v) : v, null, 2);
  } catch {
    return String(v ?? "");
  }
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
