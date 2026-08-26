import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { trackByShipmentId, trackByAwb } from "@/lib/shiprocket";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await params;
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type"); // "awb" | null

  try {
    const data = type === "awb"
      ? await trackByAwb(id)
      : await trackByShipmentId(id);

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tracking failed";
    console.error("[shiprocket/track]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
