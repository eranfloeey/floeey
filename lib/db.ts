// Postgres-backed storage with a JSON-file fallback for local dev (no DATABASE_URL).
// All data access goes through this single layer.
import { sql as vsql } from "@vercel/postgres";
import fs from "node:fs/promises";
import path from "node:path";

export const HAS_PG = Boolean(
  process.env.POSTGRES_URL || process.env.DATABASE_URL
);

// Local JSON fallback location. On Vercel /var/task is read-only, but /tmp is
// writable (per-instance, ephemeral). Locally we still use the repo's data/
// folder so devs get persistent data across reloads. If you're on Vercel
// without POSTGRES_URL, leads end up in /tmp and disappear on cold start —
// add Vercel Postgres in the dashboard to persist them properly.
const LOCAL_DIR =
  process.env.VERCEL === "1" ? "/tmp" : path.join(process.cwd(), "data");
const LOCAL_PATH = path.join(LOCAL_DIR, "local.json");

if (!HAS_PG && process.env.VERCEL === "1") {
  console.warn(
    "[floeey] No POSTGRES_URL set — falling back to /tmp/local.json. Data WILL be lost on cold starts. Configure Vercel Postgres to persist leads."
  );
}

type LocalShape = {
  leads: any[];
  variants: any[];
  pixels: any[];
  webhooks?: any[];
  webhook_logs?: any[];
};

async function loadLocal(): Promise<LocalShape> {
  try {
    const txt = await fs.readFile(LOCAL_PATH, "utf-8");
    return JSON.parse(txt);
  } catch {
    return { leads: [], variants: [], pixels: [] };
  }
}

async function saveLocal(d: LocalShape) {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(d, null, 2));
}

// Initialize tables in Postgres if they don't exist
let initialized = false;
export async function ensureSchema() {
  if (!HAS_PG || initialized) return;
  await vsql`CREATE TABLE IF NOT EXISTS leads (
    id           SERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name         TEXT,
    phone        TEXT,
    variant_id   TEXT,
    referrer     TEXT,
    landing_url  TEXT,
    utm_source   TEXT,
    utm_medium   TEXT,
    utm_campaign TEXT,
    utm_term     TEXT,
    utm_content  TEXT,
    fbclid       TEXT,
    gclid        TEXT,
    user_agent   TEXT,
    ip           TEXT,
    extra        JSONB
  )`;
  await vsql`CREATE TABLE IF NOT EXISTS variants (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    weight      INT NOT NULL DEFAULT 0,
    is_control  BOOLEAN NOT NULL DEFAULT FALSE,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    overrides   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await vsql`CREATE TABLE IF NOT EXISTS pixels (
    id          SERIAL PRIMARY KEY,
    page        TEXT NOT NULL DEFAULT 'all',
    head_code   TEXT NOT NULL DEFAULT '',
    body_code   TEXT NOT NULL DEFAULT '',
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await vsql`CREATE TABLE IF NOT EXISTS webhooks (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    url           TEXT NOT NULL,
    form_id       TEXT,                       -- NULL = fires for every form
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    secret        TEXT,                       -- optional, sent as x-floeey-secret
    headers       JSONB NOT NULL DEFAULT '{}'::jsonb,
    body_template TEXT,                       -- NULL = default Floeey envelope
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  // Migrations for instances created before headers + body_template existed.
  await vsql`ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await vsql`ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS body_template TEXT`;
  await vsql`CREATE TABLE IF NOT EXISTS webhook_logs (
    id              SERIAL PRIMARY KEY,
    webhook_id      INT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    lead_id         INT,
    request_body    JSONB,
    response_status INT,
    response_body   TEXT,
    error           TEXT,
    success         BOOLEAN NOT NULL DEFAULT FALSE,
    duration_ms     INT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await vsql`CREATE INDEX IF NOT EXISTS webhook_logs_webhook_id_sent_at_idx
    ON webhook_logs (webhook_id, sent_at DESC)`;
  initialized = true;
}

// ---------- LEADS ----------
export type Lead = {
  id?: number;
  created_at?: string;
  name: string;
  phone: string;
  variant_id?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  user_agent?: string | null;
  ip?: string | null;
  extra?: any;
};

export async function insertLead(l: Lead): Promise<number | null> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`INSERT INTO leads (
      name, phone, variant_id, referrer, landing_url,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      fbclid, gclid, user_agent, ip, extra
    ) VALUES (
      ${l.name}, ${l.phone}, ${l.variant_id ?? null}, ${l.referrer ?? null}, ${l.landing_url ?? null},
      ${l.utm_source ?? null}, ${l.utm_medium ?? null}, ${l.utm_campaign ?? null}, ${l.utm_term ?? null}, ${l.utm_content ?? null},
      ${l.fbclid ?? null}, ${l.gclid ?? null}, ${l.user_agent ?? null}, ${l.ip ?? null}, ${JSON.stringify(l.extra ?? {})}::jsonb
    ) RETURNING id`;
    return (r.rows[0] as any)?.id ?? null;
  }
  const d = await loadLocal();
  const id = Date.now();
  d.leads.unshift({ ...l, id, created_at: new Date().toISOString() });
  await saveLocal(d);
  return id;
}

export async function listLeads(limit = 200): Promise<Lead[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM leads ORDER BY id DESC LIMIT ${limit}`;
    return r.rows as any;
  }
  const d = await loadLocal();
  return d.leads.slice(0, limit);
}

// Merge a partial object into the lead's `extra` JSONB column. Used to attach
// downstream-call records (like the NLPearl request/response) onto an existing
// lead without rewriting all of its fields.
export async function updateLeadExtra(id: number, patch: Record<string, any>) {
  if (HAS_PG) {
    await ensureSchema();
    // Postgres jsonb || jsonb merges objects shallow — exactly what we want.
    await vsql`UPDATE leads
      SET extra = COALESCE(extra, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb
      WHERE id = ${id}`;
    return;
  }
  const d = await loadLocal();
  const i = d.leads.findIndex((x: any) => x.id === id);
  if (i >= 0) {
    d.leads[i].extra = { ...(d.leads[i].extra || {}), ...patch };
    await saveLocal(d);
  }
}

// ---------- VARIANTS ----------
export type VariantOverrides = {
  eyebrow?: string;
  h1_html?: string;        // raw HTML for the headline (with <br/>)
  lead_html?: string;
  cta_text?: string;
};
export type Variant = {
  id: string;
  name: string;
  weight: number;
  is_control: boolean;
  enabled: boolean;
  overrides: VariantOverrides;
  created_at?: string;
};

export async function listVariants(): Promise<Variant[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM variants ORDER BY is_control DESC, id ASC`;
    return r.rows.map((row: any) => ({
      ...row,
      overrides: row.overrides || {},
    }));
  }
  const d = await loadLocal();
  return d.variants.length
    ? d.variants
    : [
        {
          id: "control",
          name: "Control",
          weight: 100,
          is_control: true,
          enabled: true,
          overrides: {},
        },
      ];
}

export async function upsertVariant(v: Variant) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`INSERT INTO variants (id, name, weight, is_control, enabled, overrides)
      VALUES (${v.id}, ${v.name}, ${v.weight}, ${v.is_control}, ${v.enabled}, ${JSON.stringify(v.overrides)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        weight = EXCLUDED.weight,
        is_control = EXCLUDED.is_control,
        enabled = EXCLUDED.enabled,
        overrides = EXCLUDED.overrides`;
    return;
  }
  const d = await loadLocal();
  const i = d.variants.findIndex((x) => x.id === v.id);
  if (i >= 0) d.variants[i] = v;
  else d.variants.push(v);
  await saveLocal(d);
}

export async function deleteVariant(id: string) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`DELETE FROM variants WHERE id = ${id}`;
    return;
  }
  const d = await loadLocal();
  d.variants = d.variants.filter((x) => x.id !== id);
  await saveLocal(d);
}

export async function getVariant(id: string): Promise<Variant | null> {
  const all = await listVariants();
  return all.find((v) => v.id === id) ?? null;
}

// ---------- PIXELS ----------
export type Pixel = {
  id?: number;
  page: string;            // 'all' | 'home' | 'admin' | future pages
  head_code: string;
  body_code: string;
  enabled: boolean;
  updated_at?: string;
};

export async function listPixels(): Promise<Pixel[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM pixels ORDER BY page ASC, id ASC`;
    return r.rows as any;
  }
  const d = await loadLocal();
  return d.pixels;
}

export async function upsertPixel(p: Pixel) {
  if (HAS_PG) {
    await ensureSchema();
    if (p.id) {
      await vsql`UPDATE pixels SET page=${p.page}, head_code=${p.head_code}, body_code=${p.body_code}, enabled=${p.enabled}, updated_at=NOW() WHERE id=${p.id}`;
    } else {
      await vsql`INSERT INTO pixels (page, head_code, body_code, enabled) VALUES (${p.page}, ${p.head_code}, ${p.body_code}, ${p.enabled})`;
    }
    return;
  }
  const d = await loadLocal();
  if (p.id) {
    const i = d.pixels.findIndex((x: any) => x.id === p.id);
    if (i >= 0) d.pixels[i] = { ...d.pixels[i], ...p, updated_at: new Date().toISOString() };
  } else {
    d.pixels.push({ ...p, id: Date.now(), updated_at: new Date().toISOString() });
  }
  await saveLocal(d);
}

export async function deletePixel(id: number) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`DELETE FROM pixels WHERE id = ${id}`;
    return;
  }
  const d = await loadLocal();
  d.pixels = d.pixels.filter((x: any) => x.id !== id);
  await saveLocal(d);
}

// ---------- WEBHOOKS ----------
export type Webhook = {
  id?: number;
  name: string;
  url: string;
  form_id?: string | null;          // NULL = matches every form
  enabled: boolean;
  secret?: string | null;            // optional, sent as x-floeey-secret header
  headers?: Record<string, string>;  // arbitrary headers merged on top of defaults
  body_template?: string | null;     // raw body template w/ {{placeholders}}; null = default Floeey envelope
  created_at?: string;
  updated_at?: string;
};

export async function listWebhooks(): Promise<Webhook[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM webhooks ORDER BY id ASC`;
    return r.rows as any;
  }
  const d = await loadLocal();
  return d.webhooks ?? [];
}

export async function getWebhook(id: number): Promise<Webhook | null> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM webhooks WHERE id = ${id} LIMIT 1`;
    return (r.rows[0] as any) ?? null;
  }
  const d = await loadLocal();
  return (d.webhooks ?? []).find((w: any) => w.id === id) ?? null;
}

export async function upsertWebhook(w: Webhook): Promise<Webhook> {
  const headersJson = JSON.stringify(w.headers ?? {});
  if (HAS_PG) {
    await ensureSchema();
    if (w.id) {
      const r = await vsql`UPDATE webhooks
        SET name=${w.name}, url=${w.url}, form_id=${w.form_id ?? null},
            enabled=${w.enabled}, secret=${w.secret ?? null},
            headers=${headersJson}::jsonb, body_template=${w.body_template ?? null},
            updated_at=NOW()
        WHERE id=${w.id}
        RETURNING *`;
      return r.rows[0] as any;
    }
    const r = await vsql`INSERT INTO webhooks (name, url, form_id, enabled, secret, headers, body_template)
      VALUES (${w.name}, ${w.url}, ${w.form_id ?? null}, ${w.enabled}, ${w.secret ?? null},
              ${headersJson}::jsonb, ${w.body_template ?? null})
      RETURNING *`;
    return r.rows[0] as any;
  }
  const d = await loadLocal();
  d.webhooks = d.webhooks ?? [];
  if (w.id) {
    const i = d.webhooks.findIndex((x: any) => x.id === w.id);
    if (i >= 0) {
      d.webhooks[i] = { ...d.webhooks[i], ...w, headers: w.headers ?? {}, updated_at: new Date().toISOString() };
      await saveLocal(d);
      return d.webhooks[i];
    }
  }
  const created: Webhook = {
    ...w,
    headers: w.headers ?? {},
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  d.webhooks.push(created);
  await saveLocal(d);
  return created;
}

export async function deleteWebhook(id: number) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`DELETE FROM webhooks WHERE id = ${id}`;
    return;
  }
  const d = await loadLocal();
  d.webhooks = (d.webhooks ?? []).filter((x: any) => x.id !== id);
  d.webhook_logs = (d.webhook_logs ?? []).filter((x: any) => x.webhook_id !== id);
  await saveLocal(d);
}

// Webhooks that should fire for a given form_id — i.e. the ones that are
// enabled AND either match the form_id explicitly or have no form_id (catch-all).
export async function listWebhooksForForm(form_id: string | null): Promise<Webhook[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM webhooks
      WHERE enabled = TRUE
        AND (form_id IS NULL OR form_id = ${form_id ?? null})`;
    return r.rows as any;
  }
  const d = await loadLocal();
  return (d.webhooks ?? []).filter((w: any) => w.enabled && (!w.form_id || w.form_id === form_id));
}

// ---------- WEBHOOK LOGS ----------
export type WebhookLog = {
  id?: number;
  webhook_id: number;
  lead_id?: number | null;
  request_body?: any;
  response_status?: number | null;
  response_body?: string | null;
  error?: string | null;
  success: boolean;
  duration_ms?: number | null;
  sent_at?: string;
};

export async function insertWebhookLog(log: WebhookLog) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`INSERT INTO webhook_logs (
      webhook_id, lead_id, request_body, response_status, response_body, error, success, duration_ms
    ) VALUES (
      ${log.webhook_id}, ${log.lead_id ?? null}, ${JSON.stringify(log.request_body ?? null)}::jsonb,
      ${log.response_status ?? null}, ${log.response_body ?? null}, ${log.error ?? null},
      ${log.success}, ${log.duration_ms ?? null}
    )`;
    return;
  }
  const d = await loadLocal();
  d.webhook_logs = d.webhook_logs ?? [];
  d.webhook_logs.unshift({
    ...log,
    id: Date.now() + Math.floor(Math.random() * 1000),
    sent_at: new Date().toISOString(),
  });
  // keep only the most recent 1000 logs in local mode to avoid file bloat
  if (d.webhook_logs.length > 1000) d.webhook_logs.length = 1000;
  await saveLocal(d);
}

export async function listWebhookLogs(webhook_id: number, limit = 200): Promise<WebhookLog[]> {
  if (HAS_PG) {
    await ensureSchema();
    const r = await vsql`SELECT * FROM webhook_logs
      WHERE webhook_id = ${webhook_id}
      ORDER BY id DESC
      LIMIT ${limit}`;
    return r.rows as any;
  }
  const d = await loadLocal();
  return (d.webhook_logs ?? [])
    .filter((l: any) => l.webhook_id === webhook_id)
    .slice(0, limit);
}
