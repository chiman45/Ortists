-- Public star ratings for gallery artwork (open to any signed-in visitor,
-- not just the artist's connections). One rating per user per artwork.
CREATE TABLE IF NOT EXISTS artwork_ratings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (artwork_id, user_id)
);

ALTER TABLE artwork_ratings DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_artwork_ratings_artwork ON artwork_ratings(artwork_id);
