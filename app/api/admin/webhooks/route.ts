import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listWebhooks, upsertWebhook, deleteWebhook } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, webhooks: await listWebhooks() });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.url) {
    return NextResponse.json({ ok: false, error: "missing name/url" }, { status: 400 });
  }
  // Light URL validation — any parse failure here means the user typed something
  // we wouldn't be able to fetch() anyway.
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid url" }, { status: 400 });
  }
  const saved = await upsertWebhook({
    id: body.id ? Number(body.id) : undefined,
    name: String(body.name).trim(),
    url: String(body.url).trim(),
    form_id: body.form_id ? String(body.form_id).trim() : null,
    enabled: body.enabled !== false,
    secret: body.secret ? String(body.secret).trim() : null,
  });
  return NextResponse.json({ ok: true, webhook: saved });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await deleteWebhook(id);
  return NextResponse.json({ ok: true });
}
