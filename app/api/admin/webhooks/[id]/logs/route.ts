import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listWebhookLogs } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const logs = await listWebhookLogs(id, 200);
  return NextResponse.json({ ok: true, logs });
}
