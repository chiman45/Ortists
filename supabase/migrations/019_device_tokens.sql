-- Push notification device tokens for the Ortists mobile app (FCM).
-- One row per app install; a user can have several devices.
CREATE TABLE IF NOT EXISTS device_tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens (user_id);

-- Accessed only through the API with the service role, like the other tables.
ALTER TABLE device_tokens DISABLE ROW LEVEL SECURITY;
