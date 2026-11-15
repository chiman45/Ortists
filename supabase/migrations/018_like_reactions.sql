-- LinkedIn-style reactions: each like row now records which reaction was used.
-- Existing likes become "like" (❤️). Safe to run more than once.
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaction TEXT NOT NULL DEFAULT 'like';
