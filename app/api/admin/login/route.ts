import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD, setAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
