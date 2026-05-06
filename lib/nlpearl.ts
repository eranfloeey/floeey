// Direct NLPearl integration — every lead triggers an Outbound Lead create on
// the NLPearl side so their voice agent dials the customer back. This is wired
// directly into /api/leads, not through the webhook system, so it always fires
// regardless of admin configuration.
//
// Set both env vars on Vercel + locally (.env.local):
//   NLPEARL_OUTBOUND_URL  e.g. https://api.nlpearl.ai/v2/Outbound/<outboundId>/Lead
//   NLPEARL_AUTH          full Authorization header value, e.g. "Bearer <id>:<secret>"

const TIMEOUT_MS = 8000;

// Israeli phone normalization to E.164. Accepts any common entry format.
function toE164Israel(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  return "+972" + digits;
}

export async function notifyNlpearl(lead: { name: string; phone: string }): Promise<void> {
  const url = process.env.NLPEARL_OUTBOUND_URL;
  const auth = process.env.NLPEARL_AUTH;
  if (!url || !auth) {
    console.warn("NLPearl: NLPEARL_OUTBOUND_URL / NLPEARL_AUTH not set; skipping");
    return;
  }

  const body = {
    phoneNumber: toE164Israel(lead.phone),
    callData: { customerName: lead.name || "" },
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("NLPearl call failed", res.status, txt);
    }
  } catch (err: any) {
    clearTimeout(t);
    console.error("NLPearl error", err?.name === "AbortError" ? "timeout" : err?.message || err);
  }
}
