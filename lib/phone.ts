// Israeli phone normalization + validation. Accepts every reasonable user
// entry (with/without country code, +972, 00972, hyphens, spaces, parens) and
// returns canonical E.164 form ("+9725XXXXXXXX") or null if it isn't a
// recognisable Israeli number.
//
// Mobile prefixes: 5X (with 8 trailing digits → 12 total chars).
// Landline area codes: 2, 3, 4, 8, 9 (with 7 trailing digits → 11 total chars).

export function normalizeIsraeliPhone(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  // Strip the user-friendly noise we don't care about.
  s = s.replace(/[\s\-().]/g, "");

  // Convert international prefixes (+972 / 00972) to their bare-digits form.
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) {
    s = s.slice(1).replace(/\D/g, "");
    if (!s.startsWith("972")) return null; // foreign number → reject
  } else {
    s = s.replace(/\D/g, "");
    if (s.startsWith("972")) {
      // already country-coded
    } else if (s.startsWith("0")) {
      s = "972" + s.slice(1);
    } else if (s.length === 8 || s.length === 9) {
      // Looks like an Israeli number missing the leading 0 — assume domestic.
      s = "972" + s;
    } else {
      return null;
    }
  }

  // Final shape check: 972 + mobile (5XXXXXXXX) OR landline ([234689]XXXXXXX).
  if (!/^972(?:5\d{8}|[234689]\d{7})$/.test(s)) return null;
  return "+" + s;
}

export function isValidIsraeliPhone(raw: string | null | undefined): boolean {
  return normalizeIsraeliPhone(raw) !== null;
}
