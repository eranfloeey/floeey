import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listWebhooks } from "@/lib/db";
import AdminBar from "../AdminBar";
import WebhooksList from "./WebhooksList";

export default async function WebhooksPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const webhooks = await listWebhooks().catch(() => []);

  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>Webhooks</h1>
        <p className="muted">
          הטמע כתובות חיצוניות שיקבלו את נתוני הליד בכל שליחת טופס. אפשר לשייך
          וובהוק לטופס מסוים (לפי <code>form_id</code>) או להשאיר ריק כדי לקבל את
          כל הלידים.
        </p>
        <WebhooksList initial={webhooks} />
      </main>
    </>
  );
}
