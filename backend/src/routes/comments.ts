import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

// GET /api/comments?postId= — public
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.query as Record<string, string>;
  if (!postId) { res.json({ comments: [] }); return; }

  const { data } = await db.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: false });
  res.json({ comments: data ?? [] });
});

// POST /api/comments — add comment (auth required)
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const body = req.body as Record<string, unknown>;

  // Only allow commenting as yourself
  if (body.user_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { data, error } = await db.from("comments").insert(body).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }

  const { data: post } = await db.from("posts").select("comments_count").eq("id", body.post_id).single();
  if (post) await db.from("posts").update({ comments_count: post.comments_count + 1 }).eq("id", body.post_id);

  res.status(201).json({ comment: data });
});

export default router;
