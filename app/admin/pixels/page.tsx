import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listPixels } from "@/lib/db";
import AdminBar from "../AdminBar";
import PixelsEditor from "./PixelsEditor";

export default async function PixelsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const pixels = await listPixels().catch(() => []);
  return (
    <>
      <AdminBar />
      <main className="admin-main">
        <h1>פיקסלים וקודים</h1>
        <p className="muted">
          הזרק קוד ל-&lt;head&gt; או ל-&lt;body&gt; — לכל העמודים או רק לעמוד הבית. שומר את התגיות כפי שהן (אפשר להדביק את ה-snippet המלא של מטא/גוגל/אנליטיקס).
        </p>
        <PixelsEditor initial={pixels as any} />
      </main>
    </>
  );
}
