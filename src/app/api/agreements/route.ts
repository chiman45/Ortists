import { NextResponse } from "next/server";
import { AGREEMENTS, AGREEMENT_ROUTES, AGREEMENT_VERSION, REQUIRED_AGREEMENTS, type AgreementKey } from "@/lib/agreements";

/**
 * GET /api/agreements — public.
 * The current agreement version and which documents each role must accept.
 * The mobile app reads this instead of hard-coding the version, so users are
 * asked again whenever the documents change (same rule as the website).
 */
export async function GET() {
  const doc = (key: AgreementKey) => ({ key, title: AGREEMENTS[key].title, path: AGREEMENT_ROUTES[key] });
  return NextResponse.json({
    version: AGREEMENT_VERSION,
    required: {
      artist: REQUIRED_AGREEMENTS.artist.map(doc),
      client: REQUIRED_AGREEMENTS.client.map(doc),
    },
  });
}
