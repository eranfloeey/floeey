import { NextRequest, NextResponse } from "next/server";
import { insertLead, updateLeadExtra, markLeadConsent } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";
import { notifyNlpearl } from "@/lib/nlpearl";
import { normalizeIsraeliPhone } from "@/lib/phone";

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
    // Phones are normalised to E.164 (+972…) at the boundary so everything
    // downstream — DB, NLPearl, webhooks, admin views — sees the same canonical
    // form. Anything that doesn't look like a valid Israeli mobile or landline
    // gets rejected with 400.
    const phoneE164 = normalizeIsraeliPhone(body.phone);
    if (!phoneE164) {
      return NextResponse.json(
        { ok: false, error: "invalid_phone", message: "מספר טלפון ישראלי לא תקין" },
        { status: 400 }
      );
    }

    // form_id is plumbed through so future forms (besides the main lead modal)
    // can target their own webhooks. Defaults to "main" for backwards compat.
    const formId: string = String(body.form_id || "main");
    const lead = {
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
    };

    // If the client has a partial lead_id from step 1, upgrade that row to
    // consented=true instead of inserting a new one. This avoids duplicate
    // rows in the admin (one "abandoned" + one "consented" for the same user).
    // Falls through to a fresh insert if the partial row can't be found.
    let leadId: number | null = null;
    const partialId = Number(body.lead_id);
    if (Number.isFinite(partialId) && partialId > 0) {
      try {
        const upgraded = await markLeadConsent(partialId);
        if (upgraded) leadId = partialId;
      } catch (e) {
        console.error("markLeadConsent failed", e);
      }
    }

    if (leadId == null) {
      try {
        leadId = await insertLead({ ...lead, consent: true });
      } catch (e: any) {
        console.error("insertLead failed", e);
        return NextResponse.json(
          { ok: false, error: "db_insert_failed", message: e?.message || "save failed" },
          { status: 500 }
        );
      }
    }

    // Fire NLPearl outbound. The full request + response is captured and
    // stitched onto the lead row's `extra` field so the admin can audit
    // exactly what was sent and what came back per lead.
    const nlpearl = await notifyNlpearl({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
    });
    try {
      if (leadId != null) await updateLeadExtra(leadId, { nlpearl });
    } catch (e) {
      console.error("updateLeadExtra failed", e);
    }

    // Fire admin-configured webhooks too. Failures are logged, never thrown.
    fireWebhooks({
      form_id: formId,
      lead_id: leadId,
      payload: { ...lead, id: leadId, form_id: formId },
    }).catch((e) => console.error("webhook fire error", e));

    return NextResponse.json({ ok: true, lead_id: leadId });
  } catch (e: any) {
    console.error("lead route error", e);
    return NextResponse.json({ ok: false, error: "server_error", message: e?.message || "error" }, { status: 500 });
  }
}
