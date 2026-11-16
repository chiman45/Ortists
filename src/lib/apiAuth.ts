import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Server-side identity for API routes.
 *
 * Routes used to trust a `userId` sent by the client, so anyone could act as
 * anyone. These helpers take the user from the verified Clerk session instead
 * (browser cookie or `Authorization: Bearer <token>` from the mobile app).
 * Clients may still send `userId`; it is only accepted when it matches.
 */
export type AuthResult =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse };

/** Require a signed-in caller. If `claimed` is given it must be that same user. */
export async function requireUser(claimed?: string | null): Promise<AuthResult> {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (claimed && claimed !== userId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId };
}

/** The signed-in user, or null for guests. Never trust a client-sent id for "who is viewing". */
export async function viewerId(): Promise<string | null> {
  return (await auth()).userId ?? null;
}
