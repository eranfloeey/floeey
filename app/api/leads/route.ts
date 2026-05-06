import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";

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
    // form_id is plumbed through so future forms (besides the main lead modal)
    // can target their own webhooks. Defaults to "main" for backwards compat.
    const formId: string = String(body.form_id || "main");
    const lead = {
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
    };
    const leadId = await insertLead(lead);

    // Fire matching webhooks. We await so the response only resolves once each
    // webhook attempt has a log row, but downstream errors never bubble up —
    // the user must always see a success state once the lead is stored.
    await fireWebhooks({
      form_id: formId,
      lead_id: leadId,
      payload: { ...lead, id: leadId, form_id: formId },
    }).catch((e) => console.error("webhook fire error", e));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("lead error", e);
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
