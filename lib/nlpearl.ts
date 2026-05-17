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

export type NlpearlResult = {
  url: string;
  request: {
    phoneNumber: string;
    callData: { customerName: string; email?: string };
  };
  status: number | null;
  response_body: string | null;
  error: string | null;
  duration_ms: number;
  success: boolean;
  sent_at: string;
};

// Phone is expected to already be in E.164 form (validated upstream by lib/phone).
// We still pass it through unchanged so even legacy raw input gets sent to
// NLPearl rather than dropped. Email is passed in callData so the voice agent
// (and any NLPearl-side automation) can use it when a meeting gets booked.
export async function notifyNlpearl(lead: {
  name: string;
  phone: string;
  email?: string | null;
}): Promise<NlpearlResult> {
  const sentAt = new Date().toISOString();
  const callData: { customerName: string; email?: string } = {
    customerName: lead.name || "",
  };
  if (lead.email) callData.email = lead.email;
  const requestBody = {
    phoneNumber: lead.phone,
    callData,
  };

  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(NLPEARL_URL, {
      method: "POST",
      headers: {
        Authorization: NLPEARL_AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(t);
    let txt = "";
    try {
      const t2 = await res.text();
      txt = t2.length > 8000 ? t2.slice(0, 8000) + "\n…[truncated]" : t2;
    } catch {}
    if (!res.ok) console.error("NLPearl call failed", res.status, txt);
    return {
      url: NLPEARL_URL,
      request: requestBody,
      status: res.status,
      response_body: txt,
      error: null,
      duration_ms: Date.now() - started,
      success: res.ok,
      sent_at: sentAt,
    };
  } catch (err: any) {
    clearTimeout(t);
    const msg = err?.name === "AbortError" ? "timeout" : err?.message || String(err);
    console.error("NLPearl error", msg);
    return {
      url: NLPEARL_URL,
      request: requestBody,
      status: null,
      response_body: null,
      error: msg,
      duration_ms: Date.now() - started,
      success: false,
      sent_at: sentAt,
    };
  }
}
