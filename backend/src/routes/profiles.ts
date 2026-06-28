import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";

const router = Router();

// GET /api/profiles — public, multiple query modes
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { q, count, ids, username } = req.query as Record<string, string>;

  if (count === "1") {
    const { count: total } = await db.from("profiles").select("*", { count: "exact", head: true });
    res.json({ count: total ?? 0 });
    return;
  }

  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const { data } = await db.from("profiles").select("*").in("clerk_id", idList);
    res.json({ profiles: data ?? [] });
    return;
  }

  if (username) {
    const { data } = await db
      .from("profiles")
      .select("*")
      .or(`username.eq.${username},clerk_id.eq.${username}`)
      .maybeSingle();
    res.json({ profile: data ?? null });
    return;
  }

  if (q?.trim()) {
    const { data } = await db
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(30);
    res.json({ profiles: data ?? [] });
    return;
  }

  const { data } = await db
    .from("profiles")
    .select("*")
    .order("followers_count", { ascending: false })
    .limit(48);
  res.json({ profiles: data ?? [] });
});

export default router;
