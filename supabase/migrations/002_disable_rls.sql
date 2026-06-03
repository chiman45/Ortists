-- Run this in the Supabase SQL editor to fix RLS blocking inserts

ALTER TABLE profiles             DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts                DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes                DISABLE ROW LEVEL SECURITY;
ALTER TABLE saves                DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments             DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows              DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_likes    DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_saves    DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that may be blocking writes
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
