import { NextRequest, NextResponse } from "next/server";

// Stable per-visitor cookie so each user lands consistently on the same A/B variant.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  try {
    if (!req.cookies.get("floeey_uid")) {
      const uid =
        (globalThis as any).crypto?.randomUUID?.() ??
        `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      res.cookies.set({
        name: "floeey_uid",
        value: String(uid),
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  } catch (e) {
    // Never let the middleware crash the request
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|fonts|img|favicon.ico).*)"],
};
