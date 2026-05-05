import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listLeads } from "@/lib/db";
import AdminBar from "../AdminBar";

export default async function LeadsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const leads = await listLeads(500).catch(() => []);

  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>לידים</h1>
        <p className="muted">{leads.length} לידים בסה"כ</p>

        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>שם</th>
                <th>טלפון</th>
                <th>וריאנט</th>
                <th>UTM</th>
                <th>Referrer</th>
                <th>IP</th>
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
                leads.map((l: any) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.created_at)}</td>
                    <td><strong>{l.name}</strong></td>
                    <td dir="ltr" style={{ textAlign: "right" }}>{l.phone}</td>
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
                    <td style={{ fontSize: 12, color: "#b8b8c4", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.referrer || ""}>
                      {l.referrer || "-"}
                    </td>
                    <td style={{ fontSize: 12, color: "#8b8b98" }}>{l.ip || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
