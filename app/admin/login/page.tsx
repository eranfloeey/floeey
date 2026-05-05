"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "שגיאה");
      } else {
        router.replace("/admin/leads");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>כניסה לאדמין</h1>
        <p className="muted">סיסמת ניהול</p>
        {err ? <div className="alert error">{err}</div> : null}
        <label className="field">
          <span>סיסמה</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}
