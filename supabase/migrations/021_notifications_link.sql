-- Where a notification opens when it is not about a post (commission request,
-- message, new follower). `post_id` is a foreign key to posts, so other ids
-- could never be stored there and those notifications were being rejected.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
