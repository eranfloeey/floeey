import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ua = req.headers.get("user-agent") || "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    if (!body.name || !body.phone) {
      return NextResponse.json({ ok: false, error: "missing name/phone" }, { status: 400 });
    }
    await insertLead({
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      variant_id: body.variant_id ?? null,
      referrer: body.referrer ?? null,
      landing_url: body.landing_url ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_term: body.utm_term ?? null,
      utm_content: body.utm_content ?? null,
      fbclid: body.fbclid ?? null,
      gclid: body.gclid ?? null,
      user_agent: ua,
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("lead error", e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
