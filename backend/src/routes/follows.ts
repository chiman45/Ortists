import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

// GET /api/follows?followerId=&followingId= — public check
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { followerId, followingId } = req.query as Record<string, string>;
  if (!followerId || !followingId) { res.json({ following: false }); return; }

  const { data } = await db
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  res.json({ following: !!data });
});

// GET /api/follows/list?userId=&type=followers|following — public
router.get("/list", async (req: Request, res: Response): Promise<void> => {
  const { userId, type } = req.query as Record<string, string>;
  if (!userId || !type) { res.json({ users: [] }); return; }

  let clerkIds: string[] = [];
  if (type === "followers") {
    const { data } = await db.from("follows").select("follower_id").eq("following_id", userId);
    clerkIds = (data ?? []).map((r: { follower_id: string }) => r.follower_id);
  } else {
    const { data } = await db.from("follows").select("following_id").eq("follower_id", userId);
    clerkIds = (data ?? []).map((r: { following_id: string }) => r.following_id);
  }

  if (!clerkIds.length) { res.json({ users: [] }); return; }

  const { data: profiles } = await db
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url, tag")
    .in("clerk_id", clerkIds);

  res.json({ users: profiles ?? [] });
});

// POST /api/follows — follow (auth required, can only follow as yourself)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { followerId, followingId } = req.body as Record<string, string>;

  if (followerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (followerId === followingId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  await db.from("follows").insert({ follower_id: followerId, following_id: followingId });

  const { data } = await db.from("profiles").select("followers_count").eq("clerk_id", followingId).single();
  if (data) {
    await db.from("profiles").update({ followers_count: data.followers_count + 1 }).eq("clerk_id", followingId);
  }

  res.json({ ok: true });
});

// DELETE /api/follows — unfollow (auth required)
router.delete("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { followerId, followingId } = req.body as Record<string, string>;

  if (followerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  res.json({ ok: true });
});

export default router;
