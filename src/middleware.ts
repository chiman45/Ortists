import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export default clerkMiddleware((_auth, request: NextRequest) => {
  return updateSession(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)).*)",
    "/(api|trpc)(.*)",
  ],
};
