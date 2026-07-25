import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

// Prefixes that must remain public (no auth required)
// /login is the actual Clerk auth page (SignIn/SignUp embedded at that path)
// /sign-in and /sign-up are Clerk's default redirect targets
// All Clerk internal callbacks (__clerk_*) must also be allowed
const PUBLIC_PREFIXES = [
  "/",           // exact landing page — handled below with === check
  "/login",      // Clerk embedded auth page + sub-routes (verify, sso-callback, etc.)
  "/sign-in",    // Clerk default redirect target
  "/sign-up",    // Clerk default redirect target
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.slice(1).some(p => pathname.startsWith(p));
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
