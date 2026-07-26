-- Add artist_clerk_id to hire_requests so we can look up requests by real Clerk user ID
ALTER TABLE hire_requests ADD COLUMN IF NOT EXISTS artist_clerk_id TEXT;
ALTER TABLE hire_requests ADD COLUMN IF NOT EXISTS client_name     TEXT;
ALTER TABLE hire_requests ADD COLUMN IF NOT EXISTS client_avatar   TEXT;

CREATE INDEX IF NOT EXISTS idx_hr_artist_clerk_id ON hire_requests(artist_clerk_id);
