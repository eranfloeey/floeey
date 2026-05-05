// Minimal admin session: single password, signed cookie.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || "floeey-dev-secret-change-me-in-prod-please"
);
const COOKIE = "floeey_admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123123123";

export async function signAdminToken() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const c = cookies().get(COOKIE);
  if (!c?.value) return false;
  return verifyAdminToken(c.value);
}

export async function setAdminCookie() {
  const token = await signAdminToken();
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE);
}

export const ADMIN_COOKIE_NAME = COOKIE;
