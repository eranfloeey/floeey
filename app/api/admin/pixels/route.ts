import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listPixels, upsertPixel, deletePixel } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, pixels: await listPixels() });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();
  await upsertPixel({
    id: body.id ? Number(body.id) : undefined,
    page: body.page || "all",
    head_code: body.head_code || "",
    body_code: body.body_code || "",
    enabled: body.enabled !== false,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await deletePixel(id);
  return NextResponse.json({ ok: true });
}
