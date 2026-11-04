-- Sign-up role (artist / client) and electronic acceptance of the ORTISTS
-- agreements. agreement_version matches AGREEMENT_VERSION in
-- src/lib/agreements.ts: when the documents change, bump it and users whose
-- accepted version differs are asked to accept again.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role                   TEXT CHECK (role IN ('artist', 'client')),
  ADD COLUMN IF NOT EXISTS agreement_version      TEXT,
  ADD COLUMN IF NOT EXISTS agreements_accepted_at TIMESTAMPTZ;
