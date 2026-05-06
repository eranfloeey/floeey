// Direct NLPearl integration — every lead triggers an Outbound Lead create on
// the NLPearl side so their voice agent dials the customer back. Wired
// directly into /api/leads, not through the webhook system, so it always
// fires for every form submission with zero admin configuration.
//
// Credentials can be overridden by env vars (NLPEARL_OUTBOUND_URL /
// NLPEARL_AUTH) when rotating, but defaults are baked in so production works
// out of the box.

const NLPEARL_URL =
  process.env.NLPEARL_OUTBOUND_URL ||
  "https://api.nlpearl.ai/v2/Outbound/69fb76fa4a333ad9d921cbf1/Lead";
const NLPEARL_AUTH =
  process.env.NLPEARL_AUTH ||
  "Bearer 69c9010ad22ecd27841de215:YgxDo9HSaDymXlYGm413tvVAtbbFftlJ";

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
  const body = {
    phoneNumber: toE164Israel(lead.phone),
    callData: { customerName: lead.name || "" },
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(NLPEARL_URL, {
      method: "POST",
      headers: {
        Authorization: NLPEARL_AUTH,
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
