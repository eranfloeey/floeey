// Webhook delivery — fires every enabled webhook that matches a given form_id
// (or has form_id IS NULL) and writes a log row for every attempt. Errors and
// timeouts are caught and recorded, never thrown — the lead form must always
// succeed for the user even if a downstream webhook is broken.
import { listWebhooksForForm, insertWebhookLog, getWebhook, type Webhook } from "./db";

const TIMEOUT_MS = 8000;

export type WebhookEvent = {
  form_id: string | null;
  lead_id?: number | null;
  payload: Record<string, any>;
};

// Israeli phone normalization to E.164 format. Accepts:
//   0541234567        -> +972541234567
//   541234567         -> +972541234567
//   +972541234567     -> +972541234567 (already normalized)
//   972541234567      -> +972541234567
// Anything that doesn't look like an Israeli number is returned unchanged so
// the webhook still has *something* in the field even if formatting fails.
function toE164Israel(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  return "+972" + digits;
}

// Build the variable bag that body templates read from. We expose the lead's
// raw fields plus a few derived helpers (phone_e164, full event metadata).
function buildVars(event: WebhookEvent, hook: Webhook): Record<string, any> {
  const data = event.payload || {};
  return {
    ...data,
    form_id: event.form_id ?? "",
    lead_id: event.lead_id ?? "",
    timestamp: new Date().toISOString(),
    webhook_id: hook.id ?? "",
    phone_e164: toE164Israel(data.phone),
  };
}

// Replace {{key}} with the matching value from `vars`. Values are JSON-escaped
// so a name like John "The" Doe doesn't break a JSON template — the user can
// safely write `"name": "{{name}}"` without worrying about quoting. Numeric
// fields work too: write `"id": {{lead_id}}` (no quotes) and the substituted
// `123` is valid JSON. Missing keys collapse to an empty string.
function renderTemplate(tpl: string, vars: Record<string, any>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    if (v === null || v === undefined) return "";
    // JSON.stringify a string gives us "..."; strip outer quotes so the value
    // slots cleanly into either a string position ("...{{x}}...") or a bare
    // position ({{x}} alone).
    return JSON.stringify(String(v)).slice(1, -1);
  });
}

// Build the actual outgoing body. If a template is set, use it (rendered).
// Otherwise fall back to the default Floeey envelope.
function buildBody(hook: Webhook, event: WebhookEvent, vars: Record<string, any>): {
  bodyText: string;
  bodyForLog: any;
} {
  const tpl = hook.body_template?.trim();
  if (tpl) {
    const text = renderTemplate(tpl, vars);
    let parsed: any = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // not JSON — keep raw text; the log will show the literal body
    }
    return { bodyText: text, bodyForLog: parsed };
  }
  const envelope = {
    event: "lead.created",
    form_id: event.form_id,
    lead_id: event.lead_id ?? null,
    timestamp: new Date().toISOString(),
    data: event.payload,
  };
  return { bodyText: JSON.stringify(envelope), bodyForLog: envelope };
}

// Build outgoing headers. Defaults go on first; the user's custom headers can
// override anything (e.g. supplying their own Authorization or content-type).
// The legacy `secret` field still sets x-floeey-secret if present.
function buildHeaders(hook: Webhook): Record<string, string> {
  const base: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "Floeey-Webhook/1.0",
  };
  if (hook.secret) base["x-floeey-secret"] = hook.secret;
  const custom = hook.headers ?? {};
  for (const [k, v] of Object.entries(custom)) {
    if (typeof v === "string" && v.length) base[k.toLowerCase()] = v;
  }
  return base;
}

async function deliver(hook: Webhook, event: WebhookEvent): Promise<void> {
  const vars = buildVars(event, hook);
  const { bodyText, bodyForLog } = buildBody(hook, event, vars);
  const headers = buildHeaders(hook);

  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers,
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(t);
    let responseText = "";
    try {
      const txt = await res.text();
      responseText = txt.length > 10000 ? txt.slice(0, 10000) + "\n…[truncated]" : txt;
    } catch {
      /* ignore body read errors */
    }
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: event.lead_id ?? null,
      request_body: bodyForLog,
      response_status: res.status,
      response_body: responseText,
      error: null,
      success: res.ok,
      duration_ms: Date.now() - started,
    });
  } catch (err: any) {
    clearTimeout(t);
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: event.lead_id ?? null,
      request_body: bodyForLog,
      response_status: null,
      response_body: null,
      error: err?.name === "AbortError" ? "timeout" : err?.message || "error",
      success: false,
      duration_ms: Date.now() - started,
    }).catch(() => {});
  }
}

export async function fireWebhooks(event: WebhookEvent): Promise<void> {
  const hooks = await listWebhooksForForm(event.form_id).catch(() => []);
  if (!hooks.length) return;
  // Fire all matching webhooks concurrently — one slow endpoint shouldn't block
  // the others.
  await Promise.allSettled(hooks.map((h) => deliver(h, event)));
}

// Manual single-fire used by /api/admin/webhooks/[id]/test. Builds a sample
// lead-shaped payload and runs it through the same delivery pipeline so the
// admin-side test exercises identical headers + body rendering as production.
export async function fireWebhookTest(id: number): Promise<{ ok: boolean; status?: number; error?: string }> {
  const hook = await getWebhook(id);
  if (!hook) return { ok: false, error: "not found" };
  const sampleLead = {
    name: "Test User",
    phone: "0501234567",
    variant_id: "control",
    landing_url: "https://floeey.test/",
    utm_source: "test",
    referrer: "",
    test: true,
  };
  const event: WebhookEvent = {
    form_id: hook.form_id ?? "main",
    lead_id: null,
    payload: sampleLead,
  };
  const vars = buildVars(event, hook);
  const { bodyText, bodyForLog } = buildBody(hook, event, vars);
  const headers = buildHeaders(hook);
  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(hook.url, { method: "POST", headers, body: bodyText, signal: controller.signal });
    clearTimeout(t);
    let txt = "";
    try {
      const t2 = await res.text();
      txt = t2.length > 10000 ? t2.slice(0, 10000) + "\n…[truncated]" : t2;
    } catch {}
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: null,
      request_body: bodyForLog,
      response_status: res.status,
      response_body: txt,
      error: null,
      success: res.ok,
      duration_ms: Date.now() - started,
    });
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    clearTimeout(t);
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: null,
      request_body: bodyForLog,
      response_status: null,
      response_body: null,
      error: err?.name === "AbortError" ? "timeout" : err?.message || "error",
      success: false,
      duration_ms: Date.now() - started,
    }).catch(() => {});
    return { ok: false, error: err?.message || "error" };
  }
}
