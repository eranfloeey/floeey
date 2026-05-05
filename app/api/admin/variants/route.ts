import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listVariants, upsertVariant, deleteVariant } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, variants: await listVariants() });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();
  if (!body.id || !body.name) {
    return NextResponse.json({ ok: false, error: "missing id/name" }, { status: 400 });
  }
  await upsertVariant({
    id: String(body.id).trim(),
    name: String(body.name).trim(),
    weight: Number(body.weight) || 0,
    is_control: Boolean(body.is_control),
    enabled: body.enabled !== false,
    overrides: body.overrides || {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await deleteVariant(id);
  return NextResponse.json({ ok: true });
}
