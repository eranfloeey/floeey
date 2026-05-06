// Webhook delivery — fires every enabled webhook that matches a given form_id
// (or has form_id IS NULL) and writes a log row for every attempt. Errors and
// timeouts are caught and recorded, never thrown — the lead form must always
// succeed for the user even if a downstream webhook is broken.
import { listWebhooksForForm, insertWebhookLog } from "./db";

const TIMEOUT_MS = 8000;

export type WebhookEvent = {
  form_id: string | null;
  lead_id?: number | null;
  payload: Record<string, any>;
};

export async function fireWebhooks(event: WebhookEvent): Promise<void> {
  const hooks = await listWebhooksForForm(event.form_id).catch(() => []);
  if (!hooks.length) return;

  // Fire all matching webhooks concurrently — one slow endpoint shouldn't block
  // the others. Each call has its own timeout and its own log row.
  await Promise.allSettled(
    hooks.map(async (hook) => {
      const requestBody = {
        event: "lead.created",
        form_id: event.form_id,
        lead_id: event.lead_id ?? null,
        timestamp: new Date().toISOString(),
        data: event.payload,
      };
      const started = Date.now();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "user-agent": "Floeey-Webhook/1.0",
        };
        if (hook.secret) headers["x-floeey-secret"] = hook.secret;

        const res = await fetch(hook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(t);

        // Read at most ~10KB of the response body so we don't bloat logs with
        // large HTML pages from misbehaving endpoints.
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
          request_body: requestBody,
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
          request_body: requestBody,
          response_status: null,
          response_body: null,
          error: err?.name === "AbortError" ? "timeout" : err?.message || "error",
          success: false,
          duration_ms: Date.now() - started,
        }).catch(() => {});
      }
    })
  );
}
