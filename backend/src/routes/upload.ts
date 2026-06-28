import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

// POST /api/upload — upload image to Supabase storage (auth required)
router.post("/", requireAuth, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

  const ext  = req.file.originalname.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await db.storage.from("artwork").upload(path, req.file.buffer, {
    contentType: req.file.mimetype,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) { res.status(500).json({ error: error.message }); return; }

  const { data } = db.storage.from("artwork").getPublicUrl(path);
  res.json({ url: data.publicUrl });
});

export default router;
