-- Add phone number to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Address book — multiple addresses per user
CREATE TABLE IF NOT EXISTS address_book (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id     TEXT NOT NULL,
  label        TEXT DEFAULT 'Home',   -- Home, Work, Other
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  pincode      TEXT NOT NULL,
  country      TEXT DEFAULT 'India',
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_book_clerk_id ON address_book(clerk_id);

ALTER TABLE address_book DISABLE ROW LEVEL SECURITY;
