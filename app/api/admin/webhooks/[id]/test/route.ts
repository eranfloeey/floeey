import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fireWebhookTest } from "@/lib/webhooks";

// Manual test fire — sends a hand-built sample payload through the exact same
// delivery pipeline (headers + body template + logging) used by real leads.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = Number(params.id);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await fireWebhookTest(id);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
