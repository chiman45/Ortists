import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const isProtected = createRouteMatcher([
  "/messages(.*)",
  "/profile(.*)",
  "/upload(.*)",
  "/dashboard(.*)",
  "/notifications(.*)",
  "/onboarding(.*)",
  // /feed, /marketplace and /hiring are intentionally public (guest browsing allowed)
  // Interactions inside feed are gated by the login-prompt modal
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (isProtected(request)) await auth.protect();
  return updateSession(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)).*)",
    "/(api|trpc)(.*)",
  ],
};
