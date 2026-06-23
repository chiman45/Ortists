import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const isProtected = createRouteMatcher(["/messages(.*)", "/profile(.*)", "/feed(.*)"]);

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
