import { getAuth } from "@clerk/express";
import { RequestHandler, Request, Response, NextFunction } from "express";

/**
 * Require a valid Clerk session.
 * Attaches req.userId for downstream handlers.
 * Returns 401 if no valid token.
 */
export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = userId;
  next();
};

/**
 * Enforce that the userId in the request body/param matches the authenticated user.
 * Pass the field name that contains the userId (default: "userId").
 */
export function requireOwnership(field = "userId"): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { userId } = getAuth(req);
    const bodyId = (req.body as Record<string, string>)[field] ?? (req.params as Record<string, string>)[field];
    if (!userId || userId !== bodyId) {
      res.status(403).json({ error: "Forbidden — you can only act as yourself" });
      return;
    }
    next();
  };
}

// Helper to get typed userId after requireAuth
export function getUser(req: Request): string {
  return (req as Request & { userId: string }).userId;
}
