import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

type DbStory = { id: string; user_id: string; author_name: string; author_username: string; author_avatar: string | null; [k: string]: unknown };
type Profile  = { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null };

// GET /api/stories — public
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await db
    .from("stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data?.length) { res.json({ stories: [] }); return; }

  const userIds = [...new Set(data.map((s: DbStory) => s.user_id))];
  const { data: profiles } = await db.from("profiles").select("clerk_id, display_name, username, avatar_url").in("clerk_id", userIds);
  const map = new Map((profiles as Profile[] ?? []).map(p => [p.clerk_id, p]));

  const enriched = data.map((s: DbStory) => {
    const p = map.get(s.user_id);
    return { ...s, author_name: p?.display_name ?? s.author_name, author_username: p?.username ?? s.author_username, author_avatar: p?.avatar_url ?? s.author_avatar };
  });

  res.json({ stories: enriched });
});

// POST /api/stories — create story (auth required)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const body = req.body as Record<string, unknown>;

  if (body.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { data, error } = await db.from("stories").insert(body).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json({ story: data });
});

// DELETE /api/stories/:id — delete own story (auth required)
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { id } = req.params;

  const { data: story } = await db.from("stories").select("user_id").eq("id", id).single();
  if (!story) { res.status(404).json({ error: "Not found" }); return; }
  if (story.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.from("stories").delete().eq("id", id);
  res.json({ ok: true });
});

// POST /api/stories/:id/view — record a view (auth required, skips self-views)
router.post("/:id/view", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const viewerId = getUser(req);
  const { id } = req.params;

  const { data: story } = await db.from("stories").select("user_id").eq("id", id).single();
  if (!story || story.user_id === viewerId) { res.json({ ok: true }); return; }

  await db.from("story_views").upsert({ story_id: id, viewer_id: viewerId }, { onConflict: "story_id,viewer_id" });
  res.json({ ok: true });
});

// GET /api/stories/:id/viewers — get viewers list (story owner only, auth required)
router.get("/:id/viewers", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { id } = req.params;

  const { data: story } = await db.from("stories").select("user_id").eq("id", id).single();
  if (!story || story.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { data: views } = await db
    .from("story_views")
    .select("viewer_id, viewed_at")
    .eq("story_id", id)
    .order("viewed_at", { ascending: false });

  if (!views?.length) { res.json({ viewers: [], count: 0 }); return; }

  const viewerIds = views.map((v: { viewer_id: string }) => v.viewer_id);
  const { data: profiles } = await db.from("profiles").select("clerk_id, display_name, username, avatar_url").in("clerk_id", viewerIds);
  const profileMap = new Map((profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) => [p.clerk_id, p]));

  const viewers = views.map((v: { viewer_id: string; viewed_at: string }) => ({
    viewerId: v.viewer_id,
    viewedAt: v.viewed_at,
    profile:  profileMap.get(v.viewer_id) ?? null,
  }));

  res.json({ viewers, count: views.length });
});

export default router;
