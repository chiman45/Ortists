-- ML training data: track which users liked/saved which categories and tags
CREATE TABLE IF NOT EXISTS user_interactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,        -- 'like' | 'save'
  category    TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ui_user_id  ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ui_category ON user_interactions(category);
CREATE INDEX IF NOT EXISTS idx_ui_action   ON user_interactions(action_type);
