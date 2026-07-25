import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Only the landing page is public — everything else requires auth
const PUBLIC_PATHS = ["/"];

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Allow the root landing page without auth
  if (PUBLIC_PATHS.includes(pathname)) {
    return updateSession(request);
  }

  // Allow Clerk's own sign-in / sign-up pages (they start with /sign)
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return updateSession(request);
  }

  // Everything else — pages and API routes — requires authentication
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
