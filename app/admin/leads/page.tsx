import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listLeads } from "@/lib/db";
import AdminBar from "../AdminBar";
import LeadsTable from "./LeadsTable";

export default async function LeadsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const leads = await listLeads(500).catch(() => []);

  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>לידים</h1>
        <p className="muted">
          {leads.length} לידים בסה"כ · לחץ על שורה כדי לראות את הקריאה ל-NLPearl
          (מה נשלח ומה הוחזר).
        </p>
        <LeadsTable leads={leads} />
      </main>
    </>
  );
}
