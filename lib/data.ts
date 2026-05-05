// SERVER-ONLY data helpers (uses lib/db which touches node fs/postgres).
import "server-only";
import { listPixels, type Variant } from "./db";

export async function getActivePixels(page: string) {
  const all = await listPixels();
  const matching = all.filter((p) => p.enabled && (p.page === "all" || p.page === page));
  return {
    head: matching.map((p) => p.head_code).filter(Boolean).join("\n"),
    body: matching.map((p) => p.body_code).filter(Boolean).join("\n"),
  };
}

// Pick a variant deterministically for a given user id (cookie value).
// Weights need not sum to 100 — we treat them as relative.
export function pickVariantForUser(variants: Variant[], userId: string): Variant | null {
  const enabled = variants.filter((v) => v.enabled && v.weight > 0);
  if (!enabled.length) return variants.find((v) => v.is_control) ?? variants[0] ?? null;

  // Simple hash to a stable [0,1) for this user
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  const total = enabled.reduce((s, v) => s + v.weight, 0);
  const target = (h % total) + 0.5;
  let acc = 0;
  for (const v of enabled) {
    acc += v.weight;
    if (target <= acc) return v;
  }
  return enabled[enabled.length - 1];
}
