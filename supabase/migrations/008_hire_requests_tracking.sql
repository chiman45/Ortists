-- Add tracking columns to hire_requests for complete order history
ALTER TABLE hire_requests
  ADD COLUMN IF NOT EXISTS accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS currency      TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS revision_count INT DEFAULT 0;

-- Backfill accepted_at for already-accepted rows using updated_at as best estimate
UPDATE hire_requests
  SET accepted_at = updated_at
  WHERE status = 'accepted' AND accepted_at IS NULL AND updated_at IS NOT NULL;

-- Backfill completed_at similarly
UPDATE hire_requests
  SET completed_at = updated_at
  WHERE status = 'completed' AND completed_at IS NULL AND updated_at IS NOT NULL;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_hr_accepted_at   ON hire_requests(accepted_at);
CREATE INDEX IF NOT EXISTS idx_hr_completed_at  ON hire_requests(completed_at);
CREATE INDEX IF NOT EXISTS idx_hr_status_client ON hire_requests(client_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_status_artist ON hire_requests(artist_clerk_id, status);
