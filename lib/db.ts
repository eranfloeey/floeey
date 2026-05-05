// Postgres-backed storage with a JSON-file fallback for local dev (no DATABASE_URL).
// All data access goes through this single layer.
import { sql as vsql } from "@vercel/postgres";
import fs from "node:fs/promises";
import path from "node:path";

export const HAS_PG = Boolean(
  process.env.POSTGRES_URL || process.env.DATABASE_URL
);

const LOCAL_PATH = path.join(process.cwd(), "data", "local.json");

type LocalShape = {
  leads: any[];
  variants: any[];
  pixels: any[];
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

export async function insertLead(l: Lead) {
  if (HAS_PG) {
    await ensureSchema();
    await vsql`INSERT INTO leads (
      name, phone, variant_id, referrer, landing_url,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      fbclid, gclid, user_agent, ip, extra
    ) VALUES (
      ${l.name}, ${l.phone}, ${l.variant_id ?? null}, ${l.referrer ?? null}, ${l.landing_url ?? null},
      ${l.utm_source ?? null}, ${l.utm_medium ?? null}, ${l.utm_campaign ?? null}, ${l.utm_term ?? null}, ${l.utm_content ?? null},
      ${l.fbclid ?? null}, ${l.gclid ?? null}, ${l.user_agent ?? null}, ${l.ip ?? null}, ${JSON.stringify(l.extra ?? {})}::jsonb
    )`;
    return;
  }
  const d = await loadLocal();
  d.leads.unshift({ ...l, id: Date.now(), created_at: new Date().toISOString() });
  await saveLocal(d);
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
