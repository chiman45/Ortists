-- ─────────────────────────────────────────
-- Ortist – full schema
-- Run once in Supabase SQL editor
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (synced with Clerk) ──────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id      TEXT UNIQUE NOT NULL,
  username      TEXT,
  display_name  TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  location      TEXT,
  tag           TEXT DEFAULT 'Artist',
  available     BOOLEAN DEFAULT true,
  response_time TEXT DEFAULT 'Within 24 hours',
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  total_likes     INT DEFAULT 0,
  rating          NUMERIC(3,1) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Posts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         TEXT NOT NULL,
  author_name     TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_avatar   TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT NOT NULL,
  category        TEXT DEFAULT 'General',
  tags            TEXT[] DEFAULT '{}',
  medium          TEXT,
  style           TEXT,
  location        TEXT,
  visibility      TEXT DEFAULT 'Public',
  allow_comments  BOOLEAN DEFAULT true,
  allow_downloads BOOLEAN DEFAULT false,
  likes_count     INT DEFAULT 0,
  comments_count  INT DEFAULT 0,
  saves_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Likes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id    TEXT NOT NULL,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ── Saves/Bookmarks ───────────────────────
CREATE TABLE IF NOT EXISTS saves (
  user_id    TEXT NOT NULL,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ── Comments ──────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_avatar TEXT,
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Follows ───────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ── Conversations ─────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids  TEXT[] NOT NULL,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ──────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL,
  sender_name     TEXT,
  sender_avatar   TEXT,
  text            TEXT,
  type            TEXT DEFAULT 'text',
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ─────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL,
  actor_name   TEXT,
  actor_avatar TEXT,
  type         TEXT NOT NULL,
  text         TEXT NOT NULL,
  sub_text     TEXT,
  post_id      UUID REFERENCES posts(id) ON DELETE SET NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Marketplace listings ───────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id     TEXT NOT NULL,
  seller_name   TEXT NOT NULL,
  seller_avatar TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT NOT NULL,
  price         NUMERIC(10,2),
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  is_physical   BOOLEAN DEFAULT FALSE,
  is_limited    BOOLEAN DEFAULT FALSE,
  edition_total INT,
  status        TEXT DEFAULT 'active',
  likes_count   INT DEFAULT 0,
  saves_count   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_likes (
  user_id    TEXT NOT NULL,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS marketplace_saves (
  user_id    TEXT NOT NULL,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, listing_id)
);

-- ── Disable RLS for development ───────────
-- (enable + configure proper policies before production)
ALTER TABLE profiles            DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts               DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes               DISABLE ROW LEVEL SECURITY;
ALTER TABLE saves               DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows             DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages            DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_likes   DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_saves   DISABLE ROW LEVEL SECURITY;

-- ── Storage bucket for artwork ────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork', 'artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read + authenticated upload for artwork bucket
CREATE POLICY "artwork_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artwork');

CREATE POLICY "artwork_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artwork');

CREATE POLICY "artwork_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artwork');

CREATE POLICY "artwork_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'artwork');
