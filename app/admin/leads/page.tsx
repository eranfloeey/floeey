import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listLeads, HAS_PG } from "@/lib/db";
import AdminBar from "../AdminBar";
import LeadsTable from "./LeadsTable";

export default async function LeadsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const leads = await listLeads(500).catch(() => []);
  // On Vercel, when no Postgres is configured we're falling back to a
  // per-instance /tmp file. Lambdas don't share /tmp, so the lead a user
  // submitted in one invocation may land in a different /tmp than the one
  // serving the admin page → leads "vanish". Surface this loudly so the
  // operator stops debugging app code and sets up the database instead.
  const ephemeral = !HAS_PG && process.env.VERCEL === "1";

  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>לידים</h1>
        {ephemeral ? (
          <div
            className="alert error"
            style={{
              marginBottom: 18,
              fontSize: 14,
              lineHeight: 1.5,
              padding: "14px 18px",
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>
              ⚠️ אין מסד נתונים מוגדר — הלידים לא נשמרים לאורך זמן
            </strong>
            הקריאה לטופס נשמרת זמנית ב-<code>/tmp</code> של ה-Lambda של Vercel,
            וכל deploy או cold-start מוחק אותה. בנוסף, Lambdas שונים לא חולקים
            את <code>/tmp</code>, לכן ייתכן שהליד שהגיש משתמש לא יופיע כאן בכלל.
            <div style={{ marginTop: 10, fontWeight: 600 }}>תיקון (חד-פעמי, ~30 שניות):</div>
            <ol style={{ paddingInlineStart: 22, marginTop: 6, lineHeight: 1.7 }}>
              <li>Vercel Dashboard → הפרויקט שלך → <strong>Storage</strong> → <strong>Create</strong> → <strong>Postgres</strong></li>
              <li>בחר region (עדיף <code>fra1</code> לישראל) ולחץ Create</li>
              <li>Vercel יזריק אוטומטית את <code>POSTGRES_URL</code> ל-env vars</li>
              <li>Redeploy → הקוד יזהה את ה-DB ויצור את הטבלאות בפעם הראשונה</li>
            </ol>
          </div>
        ) : null}
        <p className="muted">
          {leads.length} לידים בסה"כ · לחץ על שורה כדי לראות את הקריאה ל-NLPearl
          (מה נשלח ומה הוחזר).
        </p>
        <LeadsTable leads={leads} />
      </main>
    </>
  );
}
