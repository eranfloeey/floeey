"use client";

import { useState } from "react";

type Lead = {
  id?: number;
  created_at?: string;
  name?: string;
  phone?: string;
  variant_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  referrer?: string | null;
  ip?: string | null;
  extra?: any;
};

// Renders the leads table. Each row is clickable and expands a detail panel
// showing the NLPearl call we made when the lead was submitted: the exact
// request body, the response status, and what NLPearl returned. This is the
// audit log the user asked for — per lead, what hit the API and what came back.
export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>שם</th>
            <th>טלפון</th>
            <th>NLPearl</th>
            <th>וריאנט</th>
            <th>UTM</th>
            <th>Referrer</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#8b8b98" }}>
                אין לידים עדיין
              </td>
            </tr>
          ) : (
            leads.flatMap((l) => {
              const np = l.extra?.nlpearl;
              const isOpen = openId === l.id;
              const rows = [
                <tr
                  key={l.id}
                  onClick={() => setOpenId(isOpen ? null : (l.id ?? null))}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontSize: 12 }}>{formatDate(l.created_at)}</td>
                  <td><strong>{l.name}</strong></td>
                  <td dir="ltr" style={{ textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                    {l.phone}
                  </td>
                  <td>{nlPearlBadge(np)}</td>
                  <td>
                    {l.variant_id ? (
                      <span className="pill pink">{l.variant_id}</span>
                    ) : (
                      <span className="pill gray">-</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "#b8b8c4" }}>
                    {[l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(" / ") || "-"}
                    {l.fbclid ? <div>fbclid: {String(l.fbclid).slice(0, 20)}…</div> : null}
                    {l.gclid ? <div>gclid: {String(l.gclid).slice(0, 20)}…</div> : null}
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      color: "#b8b8c4",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={l.referrer || ""}
                  >
                    {l.referrer || "-"}
                  </td>
                </tr>,
              ];
              if (isOpen) {
                rows.push(
                  <tr key={`${l.id}-detail`}>
                    <td colSpan={7} style={{ background: "#0a0a10", padding: 18 }}>
                      <NlPearlDetail np={np} ip={l.ip} />
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
  );
}

function nlPearlBadge(np: any) {
  if (!np) return <span className="pill gray">לא נשלח</span>;
  if (np.success) return <span className="pill green">✓ {np.status ?? "OK"}</span>;
  if (np.status) {
    return (
      <span
        className="pill"
        style={{ background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}
      >
        {np.status}
      </span>
    );
  }
  return (
    <span
      className="pill"
      style={{ background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}
    >
      {np.error || "fail"}
    </span>
  );
}

function NlPearlDetail({ np, ip }: { np: any; ip?: string | null }) {
  if (!np) {
    return (
      <div style={{ fontSize: 13, color: "#8b8b98" }}>
        לא נרשמה קריאה ל-NLPearl לליד הזה (אולי נוצר לפני שהאינטגרציה עלתה).
        {ip ? <div style={{ marginTop: 6 }}>IP: {ip}</div> : null}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div>
        <div style={summaryLineStyle}>
          <strong>נשלח:</strong>{" "}
          <span dir="ltr" style={{ fontFamily: "ui-monospace, monospace" }}>
            {np.url}
          </span>
        </div>
        <div style={summaryLineStyle}>
          <strong>זמן:</strong> {formatDate(np.sent_at)}{" "}
          {typeof np.duration_ms === "number" ? `(${np.duration_ms}ms)` : ""}
        </div>
        <div style={{ ...summaryLineStyle, marginBottom: 8 }}>
          <strong>סטטוס:</strong>{" "}
          {np.success ? (
            <span style={{ color: "#4ade80" }}>הצליח ({np.status ?? "OK"})</span>
          ) : np.status ? (
            <span style={{ color: "#fca5a5" }}>נכשל ({np.status})</span>
          ) : (
            <span style={{ color: "#fca5a5" }}>{np.error || "כשל"}</span>
          )}
        </div>
        <div style={labelStyle}>Request body</div>
        <pre style={preStyle}>{prettyJson(np.request)}</pre>
      </div>
      <div>
        <div style={labelStyle}>
          Response{np.status ? ` (${np.status})` : ""}
        </div>
        <pre style={preStyle}>
          {np.error ? `error: ${np.error}` : np.response_body || "(empty)"}
        </pre>
      </div>
    </div>
  );
}

const summaryLineStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#b8b8c4",
  marginBottom: 4,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#8b8b98",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 6,
  marginTop: 6,
};
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
