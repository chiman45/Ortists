import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/stories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await adminDb.from("stories").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
