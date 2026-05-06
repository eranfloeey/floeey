import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getWebhook, insertWebhookLog } from "@/lib/db";

// Manual test fire — sends a hand-built sample payload to a single webhook so
// the user can verify their endpoint without having to submit a real lead.
// Logs the attempt the same way a real lead-driven fire would, so the result
// shows up in the webhook's history.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const hook = await getWebhook(id);
  if (!hook) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const requestBody = {
    event: "lead.test",
    form_id: hook.form_id ?? "main",
    lead_id: null,
    timestamp: new Date().toISOString(),
    data: {
      name: "Test User",
      phone: "0501234567",
      variant_id: "control",
      landing_url: "https://floeey.test/",
      utm_source: "test",
      test: true,
    },
  };

  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "Floeey-Webhook/1.0 (test)",
    };
    if (hook.secret) headers["x-floeey-secret"] = hook.secret;
    const res = await fetch(hook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(t);
    let txt = "";
    try {
      const t2 = await res.text();
      txt = t2.length > 10000 ? t2.slice(0, 10000) + "\n…[truncated]" : t2;
    } catch {}
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: null,
      request_body: requestBody,
      response_status: res.status,
      response_body: txt,
      error: null,
      success: res.ok,
      duration_ms: Date.now() - started,
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (err: any) {
    clearTimeout(t);
    await insertWebhookLog({
      webhook_id: hook.id!,
      lead_id: null,
      request_body: requestBody,
      response_status: null,
      response_body: null,
      error: err?.name === "AbortError" ? "timeout" : err?.message || "error",
      success: false,
      duration_ms: Date.now() - started,
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: err?.message || "error" }, { status: 502 });
  }
}
