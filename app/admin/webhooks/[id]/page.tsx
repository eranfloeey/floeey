import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { getWebhook, listWebhookLogs } from "@/lib/db";
import AdminBar from "../../AdminBar";
import WebhookDetail from "./WebhookDetail";

export default async function WebhookDetailPage({ params }: { params: { id: string } }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(params.id);
  if (!id) notFound();
  const hook = await getWebhook(id);
  if (!hook) notFound();
  const logs = await listWebhookLogs(id, 200).catch(() => []);

  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <p className="muted" style={{ marginBottom: 8 }}>
          <Link href="/admin/webhooks" style={{ color: "#b8b8c4" }}>
            ← כל הוובהוקים
          </Link>
        </p>
        <h1>{hook.name}</h1>
        <p className="muted" dir="ltr" style={{ textAlign: "right" }}>
          {hook.url}
        </p>
        <WebhookDetail hook={hook} initialLogs={logs} />
      </main>
    </>
  );
}
