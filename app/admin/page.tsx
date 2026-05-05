import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export default async function AdminRoot() {
  redirect((await isAdmin()) ? "/admin/leads" : "/admin/login");
}
