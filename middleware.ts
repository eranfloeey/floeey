import { NextRequest, NextResponse } from "next/server";

// Stable per-visitor cookie so each user lands consistently on the same A/B variant.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const existing = req.cookies.get("floeey_uid")?.value;
  if (!existing) {
    const uid =
      crypto.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookies.set("floeey_uid", uid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|fonts|img|favicon.ico).*)"],
};
