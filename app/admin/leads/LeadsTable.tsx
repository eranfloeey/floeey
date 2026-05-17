"use client";

import { useState } from "react";

type Lead = {
  id?: number;
  created_at?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  variant_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  referrer?: string | null;
  ip?: string | null;
  extra?: any;
  consent?: boolean;
  consent_at?: string | null;
  landing_url?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

type Filter = "all" | "consented" | "abandoned";

// Renders the leads table. Each row is clickable and expands a detail panel
// showing the NLPearl call we made when the lead was submitted: the exact
// request body, the response status, and what NLPearl returned. This is the
// audit log the user asked for — per lead, what hit the API and what came back.
export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = {
    all: leads.length,
    consented: leads.filter((l) => l.consent).length,
    abandoned: leads.filter((l) => !l.consent).length,
  };
  const filtered = leads.filter((l) => {
    if (filter === "consented") return !!l.consent;
    if (filter === "abandoned") return !l.consent;
    return true;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          הכל ({counts.all})
        </FilterBtn>
        <FilterBtn active={filter === "consented"} onClick={() => setFilter("consented")}>
          אישרו הצהרה ({counts.consented})
        </FilterBtn>
        <FilterBtn active={filter === "abandoned"} onClick={() => setFilter("abandoned")}>
          נטשו בשלב 2 ({counts.abandoned})
        </FilterBtn>
      </div>
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>שם</th>
            <th>טלפון</th>
            <th>אימייל</th>
            <th>הצהרה</th>
            <th>NLPearl</th>
            <th>וריאנט</th>
            <th>מקור (קמפיין / מודעה)</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#8b8b98" }}>
                אין לידים בקטגוריה הזו
              </td>
            </tr>
          ) : (
            filtered.flatMap((l) => {
              const np = l.extra?.nlpearl;
              const isOpen = openId === l.id;
              const rows = [
                <tr
                  key={l.id}
                  onClick={() => setOpenId(isOpen ? null : (l.id ?? null))}
                  style={{
                    cursor: "pointer",
                    opacity: l.consent ? 1 : 0.78,
                    background: l.consent ? undefined : "rgba(248,113,113,0.04)",
                  }}
                >
                  <td style={{ fontSize: 12 }}>{formatDate(l.created_at)}</td>
                  <td><strong>{l.name}</strong></td>
                  <td dir="ltr" style={{ textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                    {l.phone}
                  </td>
                  <td dir="ltr" style={{ textAlign: "right", fontSize: 12 }}>
                    {l.email ? (
                      <a
                        href={`mailto:${l.email}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "#7aa7ff", textDecoration: "underline" }}
                      >
                        {l.email}
                      </a>
                    ) : (
                      <span style={{ color: "#8b8b98" }}>-</span>
                    )}
                  </td>
                  <td>{consentBadge(l.consent)}</td>
                  <td>{nlPearlBadge(np)}</td>
                  <td>
                    {l.variant_id ? (
                      <span className="pill pink">{l.variant_id}</span>
                    ) : (
                      <span className="pill gray">-</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "#b8b8c4", maxWidth: 320 }}>
                    <SourceCell lead={l} />
                  </td>
                </tr>,
              ];
              if (isOpen) {
                rows.push(
                  <tr key={`${l.id}-detail`}>
                    <td colSpan={8} style={{ background: "#0a0a10", padding: 18 }}>
                      <NlPearlDetail np={np} ip={l.ip} consent={l.consent} />
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
    </>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--brand, #ec4c6a)" : "rgba(255,255,255,0.06)",
        color: active ? "#fff" : "#b8b8c4",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// Renders a compact, structured source summary per lead. Pulls campaign /
// adset / ad names from utm_* params (the standard naming Meta Ads Manager
// uses when you turn on URL parameters), falls back to fbclid/gclid presence,
// and shows the raw referrer + full landing URL on demand.
function SourceCell({ lead }: { lead: Lead }) {
  const source = inferSource(lead);
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          className="pill"
          style={{
            background: source.color,
            color: "#fff",
            fontSize: 11,
            padding: "2px 8px",
          }}
        >
          {source.platform}
        </span>
        {source.campaign ? (
          <span style={{ color: "#e8e8ee", fontWeight: 600 }}>
            {source.campaign}
          </span>
        ) : null}
      </div>
      {source.ad ? <div>מודעה: {source.ad}</div> : null}
      {source.medium && source.medium !== source.platform.toLowerCase() ? (
        <div>medium: {source.medium}</div>
      ) : null}
      {lead.landing_url ? (
        <a
          href={lead.landing_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            color: "#7aa7ff",
            fontSize: 11,
            textDecoration: "underline",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            maxWidth: 320,
          }}
          title={lead.landing_url}
        >
          {lead.landing_url}
        </a>
      ) : null}
      {lead.referrer ? (
        <div
          style={{
            color: "#8b8b98",
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 320,
          }}
          title={lead.referrer}
        >
          ← {lead.referrer}
        </div>
      ) : null}
    </div>
  );
}

function inferSource(l: Lead): {
  platform: string;
  color: string;
  campaign?: string;
  ad?: string;
  medium?: string;
} {
  const us = (l.utm_source || "").toLowerCase();
  const um = (l.utm_medium || "").toLowerCase();
  const referrer = (l.referrer || "").toLowerCase();
  const isMeta =
    !!l.fbclid ||
    us.includes("facebook") || us.includes("instagram") || us === "fb" || us === "ig" || us === "meta" ||
    referrer.includes("facebook.com") || referrer.includes("instagram.com");
  const isGoogle =
    !!l.gclid || us.includes("google") || referrer.includes("google.");
  let platform = l.utm_source || "ישיר";
  let color = "rgba(255,255,255,0.12)";
  if (isMeta) {
    platform = us.includes("instagram") ? "Instagram" : "Meta";
    color = "rgba(228, 64, 95, 0.55)";
  } else if (isGoogle) {
    platform = "Google";
    color = "rgba(66, 133, 244, 0.55)";
  } else if (us === "tiktok" || referrer.includes("tiktok")) {
    platform = "TikTok";
    color = "rgba(0, 0, 0, 0.55)";
  } else if (us === "linkedin" || referrer.includes("linkedin")) {
    platform = "LinkedIn";
    color = "rgba(10, 102, 194, 0.55)";
  } else if (!l.utm_source && !l.referrer) {
    platform = "ישיר";
  }
  return {
    platform,
    color,
    campaign: l.utm_campaign || undefined,
    ad: l.utm_content || l.utm_term || undefined,
    medium: l.utm_medium || undefined,
  };
}

function consentBadge(consent?: boolean) {
  if (consent) return <span className="pill green">✓ אישר</span>;
  return (
    <span
      className="pill"
      style={{ background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}
      title="המשתמש לא סימן את צ'קבוקס האישור בשלב 2 — לא בוצע חיוג"
    >
      נטש
    </span>
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

function NlPearlDetail({
  np,
  ip,
  consent,
}: {
  np: any;
  ip?: string | null;
  consent?: boolean;
}) {
  if (!np) {
    return (
      <div style={{ fontSize: 13, color: "#8b8b98" }}>
        {consent === false ? (
          <div style={{ color: "#fca5a5", marginBottom: 8 }}>
            ⚠️ המשתמש מילא שם וטלפון אבל לא אישר את ההצהרה בשלב 2. לא בוצע חיוג
            אוטומטי — אם רוצים לפנות, צריך להתקשר ידנית.
          </div>
        ) : (
          "לא נרשמה קריאה ל-NLPearl לליד הזה (אולי נוצר לפני שהאינטגרציה עלתה)."
        )}
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
