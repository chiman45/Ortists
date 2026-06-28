import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

type Profile = { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null };
type Post    = { user_id: string; author_name: string; author_username: string; author_avatar: string | null; [k: string]: unknown };

async function enrichWithProfiles(posts: Post[]) {
  if (!posts.length) return posts;
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await db
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url")
    .in("clerk_id", userIds);
  const map = new Map((profiles as Profile[] ?? []).map(p => [p.clerk_id, p]));
  return posts.map(p => {
    const prof = map.get(p.user_id);
    return { ...p, author_name: prof?.display_name ?? p.author_name, author_username: prof?.username ?? p.author_username, author_avatar: prof?.avatar_url ?? p.author_avatar };
  });
}

// GET /api/posts — public
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { userId, savedBy, category, limit = "12", offset = "0" } = req.query as Record<string, string>;

  if (savedBy) {
    const { data: saveRows } = await db.from("saves").select("post_id").eq("user_id", savedBy).order("created_at", { ascending: false });
    const postIds = (saveRows ?? []).map((r: { post_id: string }) => r.post_id);
    if (!postIds.length) { res.json({ posts: [], hasMore: false }); return; }
    const { data } = await db.from("posts").select("*").in("id", postIds);
    res.json({ posts: await enrichWithProfiles(data as Post[] ?? []), hasMore: false });
    return;
  }

  let query = db.from("posts").select("*");
  if (userId)   query = query.eq("user_id", userId);
  if (category) query = query.eq("category", category);

  const lim = parseInt(limit);
  const off = parseInt(offset);
  const { data, error } = await query.order("created_at", { ascending: false }).range(off, off + lim - 1);
  if (error) { res.status(500).json({ error: error.message }); return; }

  const posts = await enrichWithProfiles(data as Post[] ?? []);
  res.json({ posts, hasMore: posts.length === lim });
});

// GET /api/posts/:id — public
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.query as Record<string, string>;

  const { data: post, error } = await db.from("posts").select("*").eq("id", id).single();
  if (error || !post) { res.status(404).json({ post: null }); return; }

  let liked = false, saved = false;
  if (userId) {
    const [{ data: l }, { data: s }] = await Promise.all([
      db.from("likes").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
      db.from("saves").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    ]);
    liked = !!l; saved = !!s;
  }

  res.json({ post, liked, saved });
});

// POST /api/posts — create post (auth required)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const body = req.body as Record<string, unknown>;

  // Enforce the user can only post as themselves
  if (body.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { data, error } = await db.from("posts").insert(body).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json({ post: data });
});

// POST /api/posts/:id/action — like / unlike / save / unsave (auth required)
router.post("/:id/action", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { id } = req.params;
  const { action, userId: bodyUserId } = req.body as { action: string; userId: string };

  if (bodyUserId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { data: post } = await db.from("posts").select("likes_count, saves_count, category, tags").eq("id", id).single();

  if (action === "like") {
    const { data: existing } = await db.from("likes").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle();
    if (existing) { res.json({ ok: true }); return; }
    await db.from("likes").insert({ post_id: id, user_id: userId });
    if (post) await Promise.all([
      db.from("posts").update({ likes_count: post.likes_count + 1 }).eq("id", id),
      db.from("user_interactions").insert({ user_id: userId, post_id: id, action_type: "like", category: post.category ?? null, tags: post.tags ?? [] }),
    ]);
  } else if (action === "unlike") {
    await db.from("likes").delete().eq("post_id", id).eq("user_id", userId);
    if (post) await db.from("posts").update({ likes_count: Math.max(0, post.likes_count - 1) }).eq("id", id);
    await db.from("user_interactions").delete().eq("user_id", userId).eq("post_id", id).eq("action_type", "like");
  } else if (action === "save") {
    await db.from("saves").insert({ post_id: id, user_id: userId });
    if (post) await Promise.all([
      db.from("posts").update({ saves_count: post.saves_count + 1 }).eq("id", id),
      db.from("user_interactions").insert({ user_id: userId, post_id: id, action_type: "save", category: post.category ?? null, tags: post.tags ?? [] }),
    ]);
  } else if (action === "unsave") {
    await db.from("saves").delete().eq("post_id", id).eq("user_id", userId);
    if (post) await db.from("posts").update({ saves_count: Math.max(0, post.saves_count - 1) }).eq("id", id);
    await db.from("user_interactions").delete().eq("user_id", userId).eq("post_id", id).eq("action_type", "save");
  } else {
    res.status(400).json({ error: "Invalid action" }); return;
  }

  res.json({ ok: true });
});

export default router;
