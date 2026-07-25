import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

// Exact paths that need no auth (no prefix matching)
const PUBLIC_EXACT = new Set([
  "/",          // landing page
  "/feed",      // feed listing — guests can browse
  "/api/posts", // feed data loader — guests need this to load posts
]);

// Path prefixes that are publicly accessible
const PUBLIC_PREFIXES = [
  "/login",    // Clerk embedded auth page + sub-routes (verify, sso-callback, etc.)
  "/sign-in",  // Clerk default redirect target
  "/sign-up",  // Clerk default redirect target
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return updateSession(request);
  }

  // Everything else requires a valid Clerk session
  await auth.protect();
  return updateSession(request);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)).*)",
    "/(api|trpc)(.*)",
  ],
};
