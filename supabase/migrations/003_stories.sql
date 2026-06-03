CREATE TABLE IF NOT EXISTS stories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         TEXT NOT NULL,
  author_name     TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_avatar   TEXT,
  image_url       TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories (expires_at);
CREATE INDEX IF NOT EXISTS stories_user_id_idx    ON stories (user_id);
