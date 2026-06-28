import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

// POST /api/profile/sync — create or seed profile from Clerk data (auth required)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { clerk_id, display_name, username, avatar_url } = req.body as Record<string, string>;

  // Verify the caller is syncing their own profile
  if (clerk_id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { data: existing } = await db
    .from("profiles")
    .select("clerk_id")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (!existing) {
    await db.from("profiles").insert({ clerk_id, display_name, username, avatar_url });
  }

  const { data: profile } = await db.from("profiles").select("*").eq("clerk_id", clerk_id).single();
  res.json({ ok: true, profile });
});

// PATCH /api/profile/sync — update editable profile fields (auth required)
router.patch("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { clerk_id, ...updates } = req.body as Record<string, unknown>;

  if (clerk_id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("clerk_id", clerk_id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, profile });
});

export default router;
