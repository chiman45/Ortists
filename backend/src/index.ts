import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";

import { errorHandler } from "./middleware/errorHandler";
import profilesRouter    from "./routes/profiles";
import profileSyncRouter from "./routes/profileSync";
import followsRouter     from "./routes/follows";
import postsRouter       from "./routes/posts";
import commentsRouter    from "./routes/comments";
import storiesRouter     from "./routes/stories";
import messagesRouter    from "./routes/messages";
import uploadRouter      from "./routes/upload";

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow your frontend ──────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));

// ── Global rate limit: 100 req / 15 min per IP ───────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
}));

// ── Stricter limit for auth-sensitive write routes ────────────────────────────
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests." },
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Clerk — populates req.auth on every request ───────────────────────────────
app.use(clerkMiddleware());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/profiles",       profilesRouter);
app.use("/api/profile/sync",   writeLimiter, profileSyncRouter);
app.use("/api/follows",        followsRouter);
app.use("/api/posts",          postsRouter);
app.use("/api/comments",       commentsRouter);
app.use("/api/stories",        storiesRouter);
app.use("/api/messages",       messagesRouter);
app.use("/api/upload",         writeLimiter, uploadRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅  Ortist API running on http://localhost:${PORT}`);
});
