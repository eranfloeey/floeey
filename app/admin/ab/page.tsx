import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listVariants } from "@/lib/db";
import AdminBar from "../AdminBar";
import VariantsEditor from "./VariantsEditor";

export default async function ABPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const variants = await listVariants().catch(() => []);
  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>A/B Test - הירו</h1>
        <p className="muted">
          כל המבקרים מקבלים את אותו URL. הסרבר מנתב כל אחד לוריאנט לפי המשקלים. כותרת/תת-כותרת/כפתור ההירו ניתנים להחלפה לכל וריאנט.
        </p>
        <VariantsEditor initial={variants as any} />
      </main>
    </>
  );
}
