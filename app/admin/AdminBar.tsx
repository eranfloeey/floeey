"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminBar() {
  const pathname = usePathname() || "";
  const router = useRouter();

  const item = (href: string, label: string) => (
    <Link href={href} className={pathname.startsWith(href) ? "active" : ""}>
      {label}
    </Link>
  );

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <header className="admin-bar">
      <div className="brand">
        <img src="/img/logo.png" alt="Floeey" />
        <span>Admin</span>
      </div>
      <nav className="admin-nav">
        {item("/admin/leads", "לידים")}
        {item("/admin/ab", "A/B Test")}
        {item("/admin/pixels", "פיקסלים")}
      </nav>
      <button className="logout" onClick={logout}>
        יציאה
      </button>
    </header>
  );
}
