-- ── Hire Requests (commission projects) ──────
CREATE TABLE IF NOT EXISTS hire_requests (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           TEXT NOT NULL,
  artist_id           INT NOT NULL,
  artist_name         TEXT NOT NULL,
  artist_avatar       TEXT,
  artist_location     TEXT,
  artist_rating       NUMERIC(3,1) DEFAULT 5.0,
  project_title       TEXT NOT NULL,
  project_description TEXT,
  budget              NUMERIC(10,2),
  deadline            TEXT,
  status              TEXT DEFAULT 'pending',   -- pending | accepted | declined | completed
  progress            INT DEFAULT 0,
  phase               TEXT DEFAULT 'Kickoff',
  priority            TEXT DEFAULT 'High',
  conversation_id     UUID REFERENCES conversations(id) ON DELETE SET NULL,
  milestones          JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hire_requests DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hr_client_id ON hire_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_hr_artist_id ON hire_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_hr_status    ON hire_requests(status);
