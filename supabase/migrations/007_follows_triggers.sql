-- Atomic trigger to maintain followers_count / following_count on the profiles table.
-- This is the authoritative source of truth — the API still recounts after writes,
-- but the trigger catches any direct DB inserts/deletes that bypass the API.

CREATE OR REPLACE FUNCTION fn_update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
      SET followers_count = followers_count + 1
      WHERE clerk_id = NEW.following_id;
    UPDATE profiles
      SET following_count = following_count + 1
      WHERE clerk_id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
      SET followers_count = GREATEST(0, followers_count - 1)
      WHERE clerk_id = OLD.following_id;
    UPDATE profiles
      SET following_count = GREATEST(0, following_count - 1)
      WHERE clerk_id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_counts ON follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION fn_update_follow_counts();

-- Resync existing counters from the follows table (one-time backfill)
UPDATE profiles p
  SET followers_count = (
    SELECT COUNT(*) FROM follows f WHERE f.following_id = p.clerk_id
  ),
  following_count = (
    SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.clerk_id
  );
