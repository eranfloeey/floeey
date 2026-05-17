import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/db";
import { normalizeIsraeliPhone } from "@/lib/phone";

// Captures a lead at step 1 — name + phone entered, before privacy consent.
// Saves with consent=false. Does NOT fire NLPearl or webhooks: these are
// "abandoned" leads that the operator can see in the admin and decide whether
// to call manually, but we don't auto-dial them since consent wasn't given.
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
    const phoneE164 = normalizeIsraeliPhone(body.phone);
    if (!phoneE164) {
      return NextResponse.json(
        { ok: false, error: "invalid_phone", message: "מספר טלפון ישראלי לא תקין" },
        { status: 400 }
      );
    }
    const leadId = await insertLead({
      name: String(body.name).trim(),
      phone: phoneE164,
      email: body.email ? String(body.email).trim() : null,
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
      consent: false,
    });
    return NextResponse.json({ ok: true, lead_id: leadId });
  } catch (e: any) {
    console.error("partial lead route error", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message || "error" },
      { status: 500 }
    );
  }
}
