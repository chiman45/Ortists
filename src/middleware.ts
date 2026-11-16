import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

// Exact paths that need no auth (no prefix matching)
const PUBLIC_EXACT = new Set([
  "/",          // landing page
  "/feed",      // feed listing — guests can browse
  "/api/posts", // feed data loader — guests need this to load posts
  "/hiring",    // browse artists — guests can search; auth only required when hiring
  "/api/profiles", // artist list used by /hiring
  "/contact",
  "/help",
]);

// Path prefixes that are publicly accessible
const PUBLIC_PREFIXES = [
  "/login",    // Clerk embedded auth page + sub-routes (verify, sso-callback, etc.)
  "/sign-in",  // Clerk default redirect target
  "/sign-up",  // Clerk default redirect target
  "/u/",       // public artist profile pages
  "/feed/",    // single post pages — shared links open without login
  "/gallery",  // marketplace browsing (listings + detail pages) — guests can browse; auth only required to buy
  "/api/ratings", // public artwork ratings shown on marketplace listings
  "/api/profile/phone", // phone-availability check during sign-up (no session yet)
  "/api/agreements",    // agreement version + required documents (mobile app sign-up)
  "/terms",
  "/artist-platform-terms",
  "/privacy",
  "/refund",
  "/shipping",
  "/artists-agreement",
  "/client-agreement",
];

// Read-only APIs a guest needs to view a shared post or profile.
// Only GET is public here — liking, commenting, following etc. still need login.
const PUBLIC_GET_PREFIXES = [
  "/api/posts/",     // single post
  "/api/comments",   // comments on a post
  "/api/follows",    // follower counts / lists
  "/api/search",
];

function isPublic(pathname: string, method: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (method === "GET" && PUBLIC_GET_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname, request.method)) {
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
